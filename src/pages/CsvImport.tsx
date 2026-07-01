import React, { useState } from 'react'
import Papa from 'papaparse'
import { supabase } from '../lib/supabaseClient'

type Row = Record<string, string>

const EXPECTED_COLUMNS = ['project_no', 'project_name', 'trailer_plate', 'element_type', 'element_count', 'dn_no', 'volume_cum', 'weight_tons', 'delivery_date', 'remarks']

export default function CsvImport(){
  const [rows, setRows] = useState<Row[]>([])
  const [fileName, setFileName] = useState('')
  const [status, setStatus] = useState<'idle' | 'parsing' | 'ready' | 'importing' | 'done' | 'error'>('idle')
  const [result, setResult] = useState<{ inserted: number, skipped: number, errors: string[] } | null>(null)

  const handleFile = (file: File) => {
    setFileName(file.name)
    setStatus('parsing')
    Papa.parse<Row>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setRows(res.data)
        setStatus('ready')
      },
      error: () => setStatus('error'),
    })
  }

  const handleImport = async () => {
    setStatus('importing')
    let inserted = 0
    let skipped = 0
    const errors: string[] = []

    // Resolve trailer plate -> id once
    const { data: trailers } = await supabase.from('trailers').select('id,plate_no')
    const plateToId: Record<string, string> = {}
    for (const t of trailers || []) plateToId[t.plate_no] = t.id

    for (const row of rows){
      if(!row.project_no && !row.dn_no){ skipped++; continue }
      const payload = {
        project_no: row.project_no || null,
        project_name: row.project_name || null,
        location: row.project_name || null,
        trailer_id: plateToId[row.trailer_plate] ?? null,
        element_type: row.element_type || null,
        element_count: row.element_count ? parseInt(row.element_count, 10) : null,
        dn_no: row.dn_no || null,
        volume_cum: row.volume_cum ? parseFloat(row.volume_cum) : null,
        weight_tons: row.weight_tons ? parseFloat(row.weight_tons) : null,
        remarks: row.remarks || null,
        delivery_date: row.delivery_date || new Date().toISOString().slice(0, 10),
      }
      const { error } = await supabase.from('deliveries').insert([payload])
      if(error) errors.push(`${row.dn_no || row.project_no || 'row'}: ${error.message}`)
      else inserted++
    }

    setResult({ inserted, skipped, errors })
    setStatus('done')
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">Import Historical Deliveries</h2>
      <p className="text-sm text-neutral-400 mb-4">
        Upload a CSV exported from the old Excel/PDF logs to backfill the <code className="px-1 bg-neutral-800 rounded">deliveries</code> table.
        Expected columns: <code className="px-1 bg-neutral-800 rounded text-xs">{EXPECTED_COLUMNS.join(', ')}</code>
      </p>

      <div className="bg-neutral-800 rounded-lg p-4">
        <input
          type="file"
          accept=".csv"
          onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          className="text-sm"
        />

        {status === 'parsing' && <div className="mt-3 text-neutral-400 text-sm">Parsing {fileName}…</div>}

        {status === 'ready' && (
          <div className="mt-3">
            <div className="text-sm text-neutral-300">{rows.length} rows parsed from {fileName}.</div>
            <div className="mt-2 max-h-40 overflow-auto text-xs bg-neutral-900 rounded p-2">
              {rows.slice(0, 5).map((r, i) => (
                <div key={i} className="text-neutral-400 truncate">{JSON.stringify(r)}</div>
              ))}
              {rows.length > 5 && <div className="text-neutral-600">…and {rows.length - 5} more</div>}
            </div>
            <button onClick={handleImport} className="mt-3 bg-red-600 px-4 py-2 rounded text-sm">
              Import {rows.length} rows
            </button>
          </div>
        )}

        {status === 'importing' && <div className="mt-3 text-neutral-400 text-sm">Importing…</div>}

        {status === 'done' && result && (
          <div className="mt-3 text-sm">
            <div className="text-green-400">Inserted {result.inserted} rows.</div>
            {result.skipped > 0 && <div className="text-yellow-400">Skipped {result.skipped} rows missing project/DN number.</div>}
            {result.errors.length > 0 && (
              <div className="mt-2 text-red-400">
                {result.errors.length} error(s):
                <ul className="list-disc list-inside text-xs mt-1">
                  {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {status === 'error' && <div className="mt-3 text-red-400 text-sm">Couldn't parse that file as CSV.</div>}
      </div>
    </div>
  )
}
