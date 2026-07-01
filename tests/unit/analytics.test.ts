import { describe, it, expect } from 'vitest'
import { computeTrailerCycleTimes, computeUtilizationPercent, detectIdleBottlenecks, siteCongestionScore, dailyThroughput, supplierPerformance, currentFleetStatus, generateAlerts } from '../../src/lib/analytics'

const now = new Date()
const iso = (d:Date)=> d.toISOString()

describe('analytics functions', ()=>{
  it('computes trailer cycle times', ()=>{
    const events = [
      { trailer_id: 'T1', status_text: 'IN FACTORY EMPTY', status_timestamp: iso(new Date(now.getTime()-1000*60*60*5)) },
      { trailer_id: 'T1', status_text: 'UNDER LOADING AT SY', status_timestamp: iso(new Date(now.getTime()-1000*60*60*4)) },
      { trailer_id: 'T1', status_text: 'DISPATCHED', status_timestamp: iso(new Date(now.getTime()-1000*60*60*2)) },
      { trailer_id: 'T2', status_text: 'IN FACTORY EMPTY', status_timestamp: iso(new Date(now.getTime()-1000*60*60*6)) },
      { trailer_id: 'T2', status_text: 'NOT OFFLOAD', status_timestamp: iso(new Date(now.getTime()-1000*60*60*1)) },
    ]
    const cycles = computeTrailerCycleTimes(events as any)
    expect(Object.keys(cycles)).toContain('T1')
    expect(cycles['T1'].length).toBe(2)
  })

  it('computes utilization percent', ()=>{
    const start = new Date(now.getTime()-1000*60*60*24).toISOString()
    const end = new Date(now.getTime()).toISOString()
    const events = [
      { trailer_id: 'T1', status_text: 'UNDER LOADING AT SY', status_timestamp: new Date(now.getTime()-1000*60*60*3).toISOString() },
      { trailer_id: 'T1', status_text: 'DISPATCHED', status_timestamp: new Date(now.getTime()-1000*60*60*2).toISOString() }
    ]
    const util = computeUtilizationPercent(events as any, ['UNDER LOADING AT SY','DISPATCHED'], start, end)
    expect(typeof util).toBe('number')
    expect(util).toBeGreaterThanOrEqual(0)
  })

  it('detects idle bottlenecks', ()=>{
    const old = new Date(now.getTime()-1000*60*60*30).toISOString()
    const events = [ { trailer_id:'T3', status_text:'NOT OFFLOAD', status_timestamp: old } ]
    const idle = detectIdleBottlenecks(events as any, 24)
    expect(idle.length).toBeGreaterThanOrEqual(1)
  })

  it('computes site congestion score', ()=>{
    const events = [
      { trailer_id:'T1', status_text:'NOT OFFLOAD', status_timestamp: iso(new Date()), site_location:'ACERS' },
      { trailer_id:'T2', status_text:'NOT OFFLOAD', status_timestamp: iso(new Date()), site_location:'ACERS' },
      { trailer_id:'T3', status_text:'IN FACTORY EMPTY', status_timestamp: iso(new Date()), site_location:'HQ' }
    ]
    const scores = siteCongestionScore(events as any)
    expect(scores[0].site).toBe('ACERS')
    expect(scores[0].count).toBe(2)
  })

  it('aggregates daily throughput', ()=>{
    const deliveries = [
      { delivery_date: '2026-06-30', volume_cum: 10, weight_tons: 2, element_count: 4 },
      { delivery_date: '2026-06-30', volume_cum: 5, weight_tons: 1, element_count: 2 },
      { delivery_date: '2026-06-29', volume_cum: 8, weight_tons: 1.5, element_count: 3 }
    ]
    const daily = dailyThroughput(deliveries as any)
    expect(daily.length).toBe(2)
    const d = daily.find(dd=> dd.date==='2026-06-30')!
    expect(d.trips).toBe(2)
    expect(d.volume).toBe(15)
  })

  it('computes supplier performance', ()=>{
    const deliveries = [ { supplier_id:'S1', cycle_ms: 1000 }, { supplier_id:'S1', cycle_ms: 2000 }, { supplier_id:'S2', cycle_ms: 3000 } ]
    const perf = supplierPerformance(deliveries as any)
    const s1 = perf.find(p=>p.supplier==='S1')!
    expect(s1.avgCycleMs).toBe(1500)
  })

  it('returns only the latest status per trailer', ()=>{
    const events = [
      { trailer_id:'T1', status_text:'IN FACTORY EMPTY', status_timestamp: iso(new Date(now.getTime()-1000*60*60*2)) },
      { trailer_id:'T1', status_text:'NOT OFFLOAD', status_timestamp: iso(new Date(now.getTime()-1000*60*60*1)) },
      { trailer_id:'T2', status_text:'IN FACTORY EMPTY', status_timestamp: iso(now) },
    ]
    const current = currentFleetStatus(events as any)
    expect(current.length).toBe(2)
    expect(current.find(e=>e.trailer_id==='T1')!.status_text).toBe('NOT OFFLOAD')
  })

  it('generates alerts from congestion scores', ()=>{
    const congestion = [{ site:'ACERS', count: 3 }, { site:'HQ', count: 0 }, { site:'SITE2', count: 1 }]
    const alerts = generateAlerts(congestion, 24)
    expect(alerts.length).toBe(2)
    expect(alerts[0].severity).toBe('high')
    expect(alerts[1].severity).toBe('medium')
  })
})
