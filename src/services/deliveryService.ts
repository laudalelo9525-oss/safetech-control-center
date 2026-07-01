import { supabase } from '../lib/supabaseClient'

export async function createDelivery(payload:any){
  return supabase.from('deliveries').insert([payload])
}
