import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import Typeahead from '../components/Typeahead'

export default function FleetStatusForm(){
  const [plate, setPlate] = useState('')
  const [status, setStatus] = useState('UNDER LOADING AT SY')
  const [site, setSite] = useState('')
  const [driverName, setDriverName] = useState('')
  const [driverPhone, setDriverPhone] = useState('')
  const [saving, setSaving] = useState(false)

  const statuses = ['IN FACTORY EMPTY','NOT OFFLOAD','UNDER LOADING AT SY','SHIFTING AT SITE','INTERNAL SHIFTING','EMPTY/BACK TO FACTORY']

  const handleSubmit = async (e: React.FormEvent) =>{
    e.preventDefault()
    setSaving(true)
    try{
      const t = await supabase.from('trailers').select('id').eq('plate_no', plate).maybeSingle()
      const trailer_id = t.data?.id ?? null
      await supabase.from('fleet_status').insert([{ trailer_id, status_text: status, site_location: site, driver_name: driverName, driver_phone: driverPhone, status_timestamp: new Date().toISOString() }])
      setSite('')
    }catch(e){
      console.error(e)
    }
    setSaving(false)
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-2">Fleet Status Update</h2>
      <form onSubmit={handleSubmit} className="space-y-3 bg-neutral-800 p-4 rounded-lg">
        <Typeahead value={plate} onChange={setPlate} table="trailers" column="plate_no" placeholder="Trailer plate" />
        <select className="w-full p-2 rounded bg-neutral-900" value={status} onChange={e=>setStatus(e.target.value)}>
          {statuses.map(s=> <option key={s} value={s}>{s}</option>)}
        </select>
        <Typeahead value={site} onChange={setSite} table="projects" column="project_no" placeholder="Site / Project" />
        <input className="w-full p-2 rounded bg-neutral-900" placeholder="Driver name" value={driverName} onChange={e=>setDriverName(e.target.value)} />
        <input className="w-full p-2 rounded bg-neutral-900" placeholder="Driver phone" value={driverPhone} onChange={e=>setDriverPhone(e.target.value)} />
        <div className="flex items-center justify-between">
          <button className="bg-red-600 px-4 py-2 rounded">Update</button>
          <div className="text-sm text-neutral-400">{saving? 'Saving…':'Ready'}</div>
        </div>
      </form>
    </div>
  )
}
