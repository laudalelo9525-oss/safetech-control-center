import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Typeahead({ value, onChange, table, column, placeholder }: { value:string, onChange:(v:string)=>void, table:string, column:string, placeholder?:string }){
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(()=>{
    let mounted = true
    if(!value) return setSuggestions([])
    // simple fetch matching prefix
    supabase.from(table).select(column).ilike(column, `${value}%`).limit(10).then(res=>{
      if(!mounted) return
      const rows = res.data as any[]
      setSuggestions(rows.map(r=>r[column]))
    })
    return ()=>{ mounted = false }
  }, [value])

  return (
    <div>
      <input className="w-full p-2 rounded bg-neutral-900" placeholder={placeholder} value={value} onChange={e=>onChange(e.target.value)} />
      {suggestions.length>0 && (
        <div className="mt-1 bg-neutral-800 rounded max-h-40 overflow-auto">
          {suggestions.map(s=> (
            <div key={s} className="p-2 hover:bg-neutral-700 cursor-pointer" onClick={()=>onChange(s)}>{s}</div>
          ))}
        </div>
      )}
    </div>
  )
}
