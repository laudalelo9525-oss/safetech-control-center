#!/usr/bin/env node
// scripts/seed_admin.js
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed_admin.js <AUTH_UID> <ADMIN_EMAIL>

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if(!SUPABASE_URL || !SERVICE_ROLE_KEY){
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in env')
  process.exit(1)
}

const authUid = process.argv[2]
const adminEmail = process.argv[3]

if(!authUid || !adminEmail){
  console.error('Usage: node scripts/seed_admin.js <AUTH_UID> <ADMIN_EMAIL>')
  console.error('  AUTH_UID: the user id from Supabase Auth (Authentication > Users) for the account you created')
  console.error('  ADMIN_EMAIL: must match that account\'s email exactly')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function run(){
  const { data, error } = await supabase.from('users').upsert({ id: authUid, email: adminEmail, role: 'admin' })
  if(error){
    console.error('Error upserting admin user:', error)
    process.exit(1)
  }
  console.log('Admin mapping upserted:', data)
}

run()
