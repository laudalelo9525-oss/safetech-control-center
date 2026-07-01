export type FleetStatusEvent = {
  trailer_id: string
  status_text: string
  status_timestamp: string // ISO
  site_location?: string
}

export type Delivery = {
  id?: string
  project_no?: string
  delivery_date?: string // YYYY-MM-DD
  volume_cum?: number
  weight_tons?: number
  element_count?: number
  trailer_id?: string
  supplier_id?: string
}

// Compute cycle times for each trailer based on status change timestamps.
// Returns map: trailer_id -> array of cycle durations in minutes (between consecutive events)
export function computeTrailerCycleTimes(events: FleetStatusEvent[]) {
  const byTrailer: Record<string, FleetStatusEvent[]> = {}
  for (const e of events) {
    byTrailer[e.trailer_id] = byTrailer[e.trailer_id] || []
    byTrailer[e.trailer_id].push(e)
  }
  const result: Record<string, number[]> = {}
  for (const t of Object.keys(byTrailer)) {
    const list = byTrailer[t].slice().sort((a,b)=> new Date(a.status_timestamp).getTime() - new Date(b.status_timestamp).getTime())
    const durations: number[] = []
    for (let i=1;i<list.length;i++){
      const prev = new Date(list[i-1].status_timestamp)
      const cur = new Date(list[i].status_timestamp)
      const minutes = (cur.getTime() - prev.getTime())/1000/60
      if (minutes >= 0) durations.push(minutes)
    }
    result[t] = durations
  }
  return result
}

// Compute utilization % for a trailer (or across trailers) given active statuses and a time window
// statusEvents: all status events across trailers
export function computeUtilizationPercent(statusEvents: FleetStatusEvent[], activeStatuses: string[], periodStart: string, periodEnd: string){
  const start = new Date(periodStart).getTime()
  const end = new Date(periodEnd).getTime()
  const totalPeriod = Math.max(1, end - start)
  // For simplicity compute total active time across all trailers divided by (number of trailers * totalPeriod)
  const byTrailer: Record<string, FleetStatusEvent[]> = {}
  for (const e of statusEvents){
    byTrailer[e.trailer_id] = byTrailer[e.trailer_id] || []
    byTrailer[e.trailer_id].push(e)
  }
  let activeMs = 0
  let trailerCount = 0
  for (const t of Object.keys(byTrailer)){
    trailerCount++
    const list = byTrailer[t].slice().sort((a,b)=> new Date(a.status_timestamp).getTime() - new Date(b.status_timestamp).getTime())
    // walk through intervals
    for (let i=0;i<list.length;i++){
      const cur = new Date(list[i].status_timestamp).getTime()
      const next = i+1<list.length ? new Date(list[i+1].status_timestamp).getTime() : end
      const intervalStart = Math.max(cur, start)
      const intervalEnd = Math.min(next, end)
      if (intervalEnd > intervalStart && activeStatuses.includes(list[i].status_text)){
        activeMs += (intervalEnd - intervalStart)
      }
    }
  }
  const denom = trailerCount * totalPeriod
  const utilization = denom>0 ? (activeMs/denom) * 100 : 0
  return utilization
}

// Detect trailers idle in a given status for longer than thresholdHours. Returns array of trailer_ids and last status info.
export function detectIdleBottlenecks(statusEvents: FleetStatusEvent[], thresholdHours = 24){
  const latest: Record<string, FleetStatusEvent> = {}
  for (const e of statusEvents){
    const cur = latest[e.trailer_id]
    if(!cur || new Date(e.status_timestamp).getTime() > new Date(cur.status_timestamp).getTime()) latest[e.trailer_id] = e
  }
  const cutoff = Date.now() - thresholdHours*3600*1000
  const result: { trailer_id:string, status: string, since: string, msIdle:number }[] = []
  for (const [tid, ev] of Object.entries(latest)){
    const msIdle = Date.now() - new Date(ev.status_timestamp).getTime()
    if (ev.status_text === 'NOT OFFLOAD' && new Date(ev.status_timestamp).getTime() < cutoff){
      result.push({ trailer_id: tid, status: ev.status_text, since: ev.status_timestamp, msIdle })
    }
  }
  return result
}

// Returns the latest known status event for each trailer (current fleet state).
export function currentFleetStatus(events: FleetStatusEvent[]): FleetStatusEvent[] {
  const latest: Record<string, FleetStatusEvent> = {}
  for (const e of events){
    const cur = latest[e.trailer_id]
    if(!cur || new Date(e.status_timestamp).getTime() > new Date(cur.status_timestamp).getTime()) latest[e.trailer_id] = e
  }
  return Object.values(latest)
}

export type Alert = { id: string, severity: 'high' | 'medium', message: string }

// Plain-language suggested actions, surfaced at the top of the dashboard (Phase 6).
// Currently driven by site congestion; extend here as more signals (e.g. supplier
// cycle-time comparisons) get real data flowing through the deliveries table.
export function generateAlerts(congestion: { site: string, count: number }[], thresholdHours = 24): Alert[] {
  const alerts: Alert[] = []
  let i = 0
  for (const c of congestion){
    if (c.count > 0){
      alerts.push({
        id: `congestion-${i++}`,
        severity: c.count >= 3 ? 'high' : 'medium',
        message: `${c.count} trailer${c.count > 1 ? 's' : ''} idle >${thresholdHours}h at ${c.site} — site may be bottlenecked, consider rerouting the next dispatches.`
      })
    }
  }
  return alerts
}

// Compute congestion score per site: count of trailers currently in NOT OFFLOAD (or stuck) grouped by site
export function siteCongestionScore(statusEvents: FleetStatusEvent[], thresholdHours=24){
  const latest: Record<string, FleetStatusEvent> = {}
  for (const e of statusEvents){
    const cur = latest[e.trailer_id]
    if(!cur || new Date(e.status_timestamp).getTime() > new Date(cur.status_timestamp).getTime()) latest[e.trailer_id] = e
  }
  const scores: Record<string, number> = {}
  for (const ev of Object.values(latest)){
    const site = ev.site_location || 'UNKNOWN'
    if(!scores[site]) scores[site]=0
    if(ev.status_text === 'NOT OFFLOAD') scores[site]++
  }
  // return sorted array of {site, count}
  return Object.entries(scores).map(([site,count])=>({ site, count })).sort((a,b)=>b.count-a.count)
}

// Daily throughput: group deliveries by date and aggregate counts, volume, weight
export function dailyThroughput(deliveries: Delivery[]){
  const byDate: Record<string, { trips:number, volume:number, weight:number, elements:number }> = {}
  for (const d of deliveries){
    const date = d.delivery_date || (d as any).delivery_date || new Date().toISOString().slice(0,10)
    const v = d.volume_cum || 0
    const w = d.weight_tons || 0
    const elements = d.element_count || 0
    byDate[date] = byDate[date] || { trips:0, volume:0, weight:0, elements:0 }
    byDate[date].trips += 1
    byDate[date].volume += v
    byDate[date].weight += w
    byDate[date].elements += elements
  }
  return Object.entries(byDate).map(([date,agg])=> ({ date, ...agg })).sort((a,b)=> a.date.localeCompare(b.date))
}

// Supplier performance requires mapping from trailer -> supplier and cycle durations.
// Given deliveries array with supplier_id and cycle_ms, compute average cycle time per supplier
export function supplierPerformance(deliveries: (Delivery & { cycle_ms?: number })[]){
  const bySupplier: Record<string, { count:number, totalMs:number }> = {}
  for (const d of deliveries){
    const s = d.supplier_id || 'UNKNOWN'
    const ms = d.cycle_ms || 0
    bySupplier[s] = bySupplier[s] || { count:0, totalMs:0 }
    bySupplier[s].count += 1
    bySupplier[s].totalMs += ms
  }
  return Object.entries(bySupplier).map(([supplier,{count,totalMs}])=>({ supplier, avgCycleMs: count? totalMs/count : 0, trips: count }))
}
