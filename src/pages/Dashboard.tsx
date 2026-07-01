import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, Legend
} from 'recharts'
import {
  computeTrailerCycleTimes, dailyThroughput, detectIdleBottlenecks,
  currentFleetStatus, siteCongestionScore, generateAlerts,
  type FleetStatusEvent
} from '../lib/analytics'
import { supabase } from '../lib/supabaseClient'
import CountUpCard from '../components/CountUpCard'
import AlertsPanel from '../components/AlertsPanel'

const KANBAN_COLUMNS = [
  { key: 'empty', label: 'Empty', statuses: ['IN FACTORY EMPTY'], color: '#525252' },
  { key: 'loading', label: 'Loading', statuses: ['UNDER LOADING AT SY'], color: '#eab308' },
  { key: 'dispatched', label: 'Dispatched', statuses: ['SHIFTING AT SITE', 'INTERNAL SHIFTING'], color: '#3b82f6' },
  { key: 'not_offload', label: 'Not Offloaded', statuses: ['NOT OFFLOAD'], color: '#dc2626' },
  { key: 'returning', label: 'Returning', statuses: ['EMPTY/BACK TO FACTORY'], color: '#16a34a' },
]

function columnFor(statusText: string){
  return KANBAN_COLUMNS.find(c => c.statuses.includes(statusText)) ?? KANBAN_COLUMNS[0]
}

export default function Dashboard(){
  const [kpis, setKpis] = useState({ trips: 0, avgCycleHours: 0, idleCount: 0, volume: 0 })
  const [fleetEvents, setFleetEvents] = useState<FleetStatusEvent[]>([])
  const [dailyTrend, setDailyTrend] = useState<{ date: string, trips: number, volume: number }[]>([])
  const [trailerPlates, setTrailerPlates] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    async function load(){
      const [{ data: fleet }, { data: deliveries }, { data: trailers }] = await Promise.all([
        supabase.from('fleet_status').select('*').limit(1000),
        supabase.from('deliveries').select('*').limit(1000),
        supabase.from('trailers').select('id,plate_no').limit(500),
      ])

      const events = (fleet || []).map(f => ({
        trailer_id: f.trailer_id, status_text: f.status_text,
        status_timestamp: f.status_timestamp, site_location: f.site_location
      })) as FleetStatusEvent[]

      const cycles = computeTrailerCycleTimes(events)
      const all = Object.values(cycles).flat()
      const avgMins = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0

      const daily = dailyThroughput(deliveries || [])
      const trips = daily.reduce((a, b: any) => a + b.trips, 0)
      const volume = daily.reduce((a, b: any) => a + b.volume, 0)
      const idle = detectIdleBottlenecks(events, 24)

      const plateMap: Record<string, string> = {}
      for (const t of trailers || []) plateMap[t.id] = t.plate_no

      setKpis({ trips, avgCycleHours: Number((avgMins / 60).toFixed(1)), idleCount: idle.length, volume: Number(volume.toFixed(1)) })
      setFleetEvents(events)
      setDailyTrend(daily.map((d: any) => ({ date: d.date.slice(5), trips: d.trips, volume: Number(d.volume.toFixed(1)) })))
      setTrailerPlates(plateMap)
      setLoading(false)
    }
    load()
  }, [])

  const current = useMemo(()=> currentFleetStatus(fleetEvents), [fleetEvents])

  const donutData = useMemo(()=>{
    const counts: Record<string, number> = {}
    for (const e of current){
      const col = columnFor(e.status_text)
      counts[col.label] = (counts[col.label] || 0) + 1
    }
    return KANBAN_COLUMNS.map(c => ({ name: c.label, value: counts[c.label] || 0, color: c.color })).filter(d => d.value > 0)
  }, [current])

  const congestion = useMemo(()=> siteCongestionScore(fleetEvents, 24).slice(0, 6), [fleetEvents])
  const alerts = useMemo(()=> generateAlerts(siteCongestionScore(fleetEvents, 24), 24), [fleetEvents])

  if(loading) return <div className="p-6 text-neutral-400">Loading dashboard…</div>

  return (
    <div className="p-2 sm:p-6">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <AlertsPanel alerts={alerts} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CountUpCard label="Trips" value={kpis.trips} />
        <CountUpCard label="Avg Cycle (hrs)" value={kpis.avgCycleHours} />
        <CountUpCard label="Idle &gt;24h" value={kpis.idleCount} accent="red" />
        <CountUpCard label="Volume (m³)" value={kpis.volume} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-neutral-800/60 backdrop-blur border border-neutral-700 rounded-xl p-4">
          <div className="text-sm text-neutral-400 mb-2">Live Fleet Status</div>
          {donutData.length === 0 ? (
            <div className="text-neutral-500 text-sm py-10 text-center">No fleet status data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={donutData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#171717', border: '1px solid #404040' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="bg-neutral-800/60 backdrop-blur border border-neutral-700 rounded-xl p-4">
          <div className="text-sm text-neutral-400 mb-2">Bottleneck Leaderboard (idle trailers/site)</div>
          {congestion.every(c => c.count === 0) ? (
            <div className="text-neutral-500 text-sm py-10 text-center">No bottlenecks detected.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={congestion} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" horizontal={false} />
                <XAxis type="number" stroke="#a3a3a3" allowDecimals={false} />
                <YAxis type="category" dataKey="site" stroke="#a3a3a3" width={90} />
                <Tooltip contentStyle={{ background: '#171717', border: '1px solid #404040' }} />
                <Bar dataKey="count" fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="bg-neutral-800/60 backdrop-blur border border-neutral-700 rounded-xl p-4 mt-4">
        <div className="text-sm text-neutral-400 mb-2">Daily Delivery Trend</div>
        {dailyTrend.length === 0 ? (
          <div className="text-neutral-500 text-sm py-10 text-center">No deliveries logged yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis dataKey="date" stroke="#a3a3a3" />
              <YAxis stroke="#a3a3a3" />
              <Tooltip contentStyle={{ background: '#171717', border: '1px solid #404040' }} />
              <Legend />
              <Line type="monotone" dataKey="trips" stroke="#dc2626" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="volume" name="volume (m³)" stroke="#60a5fa" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </motion.div>

      <div className="mt-6">
        <div className="text-sm text-neutral-400 mb-2">Trailer Status Board</div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {KANBAN_COLUMNS.map(col => {
            const items = current.filter(e => columnFor(e.status_text).key === col.key)
            return (
              <div key={col.key} className="bg-neutral-800/60 border border-neutral-700 rounded-xl p-2 min-h-[120px]">
                <div className="text-xs font-semibold mb-2 flex items-center gap-1.5" style={{ color: col.color }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                  {col.label} ({items.length})
                </div>
                <div className="space-y-1.5">
                  {items.map(e => (
                    <motion.div
                      key={e.trailer_id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs bg-neutral-900 rounded px-2 py-1"
                    >
                      {trailerPlates[e.trailer_id] || e.trailer_id.slice(0, 8)}
                    </motion.div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
