import React, { useState } from 'react'
import DispatchForm from './DispatchForm'
import FleetStatusForm from './FleetStatusForm'
import DeliveryForm from './DeliveryForm'

type Tab = 'dispatch' | 'fleet' | 'delivery'

export default function ControllerEntry(){
  const [tab, setTab] = useState<Tab>('dispatch')

  const tabs: { key: Tab, label: string }[] = [
    { key: 'dispatch', label: 'Dispatch Log' },
    { key: 'fleet', label: 'Fleet Status' },
    { key: 'delivery', label: 'Delivery' },
  ]

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Controller Data Entry</h2>
      <div className="flex gap-2 mb-4 max-w-md mx-auto">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={()=>setTab(t.key)}
            className={`flex-1 py-2 rounded text-sm font-medium ${tab===t.key ? 'bg-red-600' : 'bg-neutral-800 text-neutral-400'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'dispatch' && <DispatchForm />}
      {tab === 'fleet' && <FleetStatusForm />}
      {tab === 'delivery' && <DeliveryForm />}
    </div>
  )
}
