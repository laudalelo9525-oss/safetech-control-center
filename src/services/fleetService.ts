import { supabase } from '../lib/supabaseClient'

export async function createFleetStatus(payload:any){
  return supabase.from('fleet_status').insert([payload])
}

export async function getFleetLatest(){
  return supabase.from('fleet_status').select('*').order('status_timestamp',{ascending:false}).limit(100)
}
