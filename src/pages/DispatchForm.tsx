import React, { useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Typeahead from '../components/Typeahead'
import useAutosave from '../hooks/useAutosave'

export default function DispatchForm(){
  const [plate, setPlate] = useState('')
  const [projectNo, setProjectNo] = useState('')
  const [doNo, setDoNo] = useState('')
  const [shift, setShift] = useState('')
  const [diesel, setDiesel] = useState(false)
  const [driverStatus, setDriverStatus] = useState(false)
  const [dnStatus, setDnStatus] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)
  const draftId = useRef<string | null>(null)

  const autosave = useAutosave(async () => {
    // Upsert a single draft row: insert once, then update the same row on
    // every subsequent autosave instead of creating a new row each time.
    if(!plate) return
    setSaving(true)
    try{
      const t = await supabase.from('trailers').select('id').eq('plate_no', plate).maybeSingle()
      const trailer_id = t.data?.id ?? null
      const payload = { trailer_id, project_no: projectNo, do_no: doNo, shift, diesel_status: diesel, driver_status: driverStatus, dn_status: dnStatus, leaving_status: leaving, remarks, log_date: new Date().toISOString().slice(0,10) }

      if(draftId.current){
        await supabase.from('dispatch_log').update(payload).eq('id', draftId.current)
      } else {
        const { data, error } = await supabase.from('dispatch_log').insert([payload]).select('id').single()
        if(!error && data) draftId.current = data.id
      }
    }catch(e){
      console.error('autosave error', e)
    }
    setSaving(false)
  }, 3000)

  useEffect(()=>{
    autosave.trigger()
  }, [plate,projectNo,doNo,shift,diesel,driverStatus,dnStatus,leaving,remarks])

  const handleSubmit = async (e: React.FormEvent) =>{
    e.preventDefault()
    setSaving(true)
    try{
      const t = await supabase.from('trailers').select('id').eq('plate_no', plate).maybeSingle()
      const trailer_id = t.data?.id ?? null
      const payload = { trailer_id, project_no: projectNo, do_no: doNo, shift, diesel_status: diesel, driver_status: driverStatus, dn_status: dnStatus, leaving_status: leaving, remarks, log_date: new Date().toISOString().slice(0,10) }

      if(draftId.current){
        await supabase.from('dispatch_log').update(payload).eq('id', draftId.current)
      } else {
        await supabase.from('dispatch_log').insert([payload])
      }
      // clear for next entry — reset draft tracking so the next row is fresh
      draftId.current = null
      setDoNo('')
      setRemarks('')
    }catch(e){
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Dispatch Log (Quick entry)</h2>
      <form onSubmit={handleSubmit} className="space-y-3 bg-neutral-800 p-4 rounded-lg">
        <Typeahead value={plate} onChange={setPlate} table="trailers" column="plate_no" placeholder="Trailer plate" />
        <Typeahead value={projectNo} onChange={setProjectNo} table="projects" column="project_no" placeholder="Project no" />
        <input className="w-full p-2 rounded bg-neutral-900" placeholder="DO No" value={doNo} onChange={e=>setDoNo(e.target.value)} />
        <input className="w-full p-2 rounded bg-neutral-900" placeholder="Shift" value={shift} onChange={e=>setShift(e.target.value)} />
        <div className="flex gap-2">
          <label className="flex-1 bg-neutral-900 p-2 rounded text-center">
            <div className="text-sm">Diesel</div>
            <button type="button" onClick={()=>setDiesel(s=>!s)} className={`mt-1 px-3 py-1 rounded ${diesel? 'bg-red-600':'bg-neutral-700'}`}>{diesel? 'Yes':'No'}</button>
          </label>
          <label className="flex-1 bg-neutral-900 p-2 rounded text-center">
            <div className="text-sm">Driver Ok</div>
            <button type="button" onClick={()=>setDriverStatus(s=>!s)} className={`mt-1 px-3 py-1 rounded ${driverStatus? 'bg-red-600':'bg-neutral-700'}`}>{driverStatus? 'Yes':'No'}</button>
          </label>
        </div>
        <div className="flex gap-2">
          <label className="flex-1 bg-neutral-900 p-2 rounded text-center">
            <div className="text-sm">DN</div>
            <button type="button" onClick={()=>setDnStatus(s=>!s)} className={`mt-1 px-3 py-1 rounded ${dnStatus? 'bg-red-600':'bg-neutral-700'}`}>{dnStatus? 'Yes':'No'}</button>
          </label>
          <label className="flex-1 bg-neutral-900 p-2 rounded text-center">
            <div className="text-sm">Leaving</div>
            <button type="button" onClick={()=>setLeaving(s=>!s)} className={`mt-1 px-3 py-1 rounded ${leaving? 'bg-red-600':'bg-neutral-700'}`}>{leaving? 'Yes':'No'}</button>
          </label>
        </div>
        <textarea className="w-full p-2 rounded bg-neutral-900" rows={3} placeholder="Remarks" value={remarks} onChange={e=>setRemarks(e.target.value)} />
        <div className="flex items-center justify-between">
          <button className="bg-red-600 px-4 py-2 rounded">Save</button>
          <div className="text-sm text-neutral-400">{saving? 'Saving…' : 'Idle'}</div>
        </div>
      </form>
    </div>
  )
}
