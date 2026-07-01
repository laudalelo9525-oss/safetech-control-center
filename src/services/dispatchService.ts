import { supabase } from '../lib/supabaseClient'

export async function createDispatch(payload: any){
  return supabase.from('dispatch_log').insert([payload])
}

export async function listTrailers(){
  return supabase.from('trailers').select('*').limit(100)
}
