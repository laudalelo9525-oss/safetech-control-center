import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Typeahead from '../components/Typeahead'

export default function DeliveryForm(){
  const [projectNo, setProjectNo] = useState('')
  const [projectName, setProjectName] = useState('')
  const [plate, setPlate] = useState('')
  const [elementType, setElementType] = useState('')
  const [elementCount, setElementCount] = useState<number | ''>('')
  const [dnNo, setDnNo] = useState('')
  const [volume, setVolume] = useState<number | ''>('')
  const [weight, setWeight] = useState<number | ''>('')
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) =>{
    e.preventDefault()
    setSaving(true)
    try{
      const t = await supabase.from('trailers').select('id').eq('plate_no', plate).maybeSingle()
      const trailer_id = t.data?.id ?? null
      await supabase.from('deliveries').insert([{ project_no: projectNo, project_name: projectName, location: projectName, trailer_id, element_type: elementType, element_count: elementCount === '' ? null : elementCount, dn_no: dnNo, volume_cum: volume === '' ? null : volume, weight_tons: weight === '' ? null : weight, remarks, delivery_date: new Date().toISOString().slice(0,10) }])
      setElementType('')
      setElementCount('')
      setDnNo('')
      setVolume('')
      setWeight('')
      setRemarks('')
    }catch(e){
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Delivery Entry</h2>
      <form onSubmit={handleSubmit} className="space-y-3 bg-neutral-800 p-4 rounded-lg">
        <Typeahead value={projectNo} onChange={setProjectNo} table="projects" column="project_no" placeholder="Project no" />
        <input className="w-full p-2 rounded bg-neutral-900" placeholder="Project name" value={projectName} onChange={e=>setProjectName(e.target.value)} />
        <Typeahead value={plate} onChange={setPlate} table="trailers" column="plate_no" placeholder="Trailer plate" />
        <input className="w-full p-2 rounded bg-neutral-900" placeholder="Element type" value={elementType} onChange={e=>setElementType(e.target.value)} />
        <input className="w-full p-2 rounded bg-neutral-900" type="number" placeholder="Element count" value={elementCount as any} onChange={e=>setElementCount(e.target.value === '' ? '' : parseInt(e.target.value))} />
        <input className="w-full p-2 rounded bg-neutral-900" placeholder="DN No" value={dnNo} onChange={e=>setDnNo(e.target.value)} />
        <input className="w-full p-2 rounded bg-neutral-900" type="number" step="0.01" placeholder="Volume (m³)" value={volume as any} onChange={e=>setVolume(e.target.value === '' ? '' : parseFloat(e.target.value))} />
        <input className="w-full p-2 rounded bg-neutral-900" type="number" step="0.01" placeholder="Weight (tons)" value={weight as any} onChange={e=>setWeight(e.target.value === '' ? '' : parseFloat(e.target.value))} />
        <textarea className="w-full p-2 rounded bg-neutral-900" rows={2} placeholder="Remarks" value={remarks} onChange={e=>setRemarks(e.target.value)} />
        <div className="flex items-center justify-between">
          <button className="bg-red-600 px-4 py-2 rounded">Save Delivery</button>
          <div className="text-sm text-neutral-400">{saving? 'Saving…':'Ready'}</div>
        </div>
      </form>
    </div>
  )
}
