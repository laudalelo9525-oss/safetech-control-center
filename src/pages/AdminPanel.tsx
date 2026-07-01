import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

type UserRow = { id: string, email: string, role: 'admin' | 'controller' | 'viewer' }
type ProjectRow = { id: string, project_no: string, project_name: string | null, location: string | null, active: boolean }
type SupplierRow = { id: string, name: string }

const ROLES: UserRow['role'][] = ['admin', 'controller', 'viewer']
type Tab = 'users' | 'projects' | 'suppliers'

export default function AdminPanel(){
  const [tab, setTab] = useState<Tab>('users')
  const [error, setError] = useState<string | undefined>(undefined)

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Admin Panel</h2>

      <div className="flex gap-2 mt-4 mb-4 max-w-md">
        {(['users', 'projects', 'suppliers'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded text-sm font-medium capitalize ${tab === t ? 'bg-red-600' : 'bg-neutral-800 text-neutral-400'}`}
          >
            {t}
          </button>
        ))}
      </div>

      {error && <div className="mb-3 text-red-400 text-sm">{error}</div>}

      {tab === 'users' && <UsersTab onError={setError} />}
      {tab === 'projects' && <ProjectsTab onError={setError} />}
      {tab === 'suppliers' && <SuppliersTab onError={setError} />}
    </div>
  )
}

function UsersTab({ onError }: { onError: (e?: string) => void }){
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  async function loadUsers(){
    setLoading(true)
    const { data, error } = await supabase.from('users').select('id,email,role').order('email')
    if(error) onError(error.message)
    else setUsers((data || []) as UserRow[])
    setLoading(false)
  }

  useEffect(()=>{ loadUsers() }, [])

  const handleRoleChange = async (id: string, role: UserRow['role']) => {
    setSavingId(id)
    const { error } = await supabase.from('users').update({ role }).eq('id', id)
    if(error) onError(error.message)
    else setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    setSavingId(null)
  }

  return (
    <div>
      <p className="text-neutral-400 text-sm mb-3">
        New accounts must first be created in Supabase Auth (Authentication → Users), then they'll
        appear here once a matching row exists in the <code className="mx-1 px-1 bg-neutral-800 rounded">users</code> table —
        see <code className="mx-1 px-1 bg-neutral-800 rounded">scripts/seed_admin.js</code> for the first admin.
      </p>
      <div className="bg-neutral-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-neutral-400">Loading users…</div>
        ) : users.length === 0 ? (
          <div className="p-4 text-neutral-400">No users yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-400 border-b border-neutral-700">
                <th className="p-3">Email</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b border-neutral-700 last:border-0">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">
                    <select
                      className="bg-neutral-900 p-1.5 rounded"
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={e => handleRoleChange(u.id, e.target.value as UserRow['role'])}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {savingId === u.id && <span className="ml-2 text-xs text-neutral-500">saving…</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function ProjectsTab({ onError }: { onError: (e?: string) => void }){
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [loading, setLoading] = useState(true)
  const [projectNo, setProjectNo] = useState('')
  const [projectName, setProjectName] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)

  async function load(){
    setLoading(true)
    const { data, error } = await supabase.from('projects').select('*').order('project_no')
    if(error) onError(error.message)
    else setProjects((data || []) as ProjectRow[])
    setLoading(false)
  }
  useEffect(()=>{ load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!projectNo) return
    setSaving(true)
    const { error } = await supabase.from('projects').insert([{ project_no: projectNo, project_name: projectName || null, location: location || null, active: true }])
    if(error) onError(error.message)
    else { setProjectNo(''); setProjectName(''); setLocation(''); await load() }
    setSaving(false)
  }

  const toggleActive = async (p: ProjectRow) => {
    const { error } = await supabase.from('projects').update({ active: !p.active }).eq('id', p.id)
    if(error) onError(error.message)
    else setProjects(prev => prev.map(x => x.id === p.id ? { ...x, active: !x.active } : x))
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex flex-wrap gap-2 mb-4 bg-neutral-800 p-3 rounded-lg">
        <input className="p-2 rounded bg-neutral-900 text-sm flex-1 min-w-[120px]" placeholder="Project no" value={projectNo} onChange={e=>setProjectNo(e.target.value)} />
        <input className="p-2 rounded bg-neutral-900 text-sm flex-1 min-w-[160px]" placeholder="Project name" value={projectName} onChange={e=>setProjectName(e.target.value)} />
        <input className="p-2 rounded bg-neutral-900 text-sm flex-1 min-w-[140px]" placeholder="Location" value={location} onChange={e=>setLocation(e.target.value)} />
        <button disabled={saving} className="bg-red-600 px-4 py-2 rounded text-sm">{saving ? 'Adding…' : 'Add'}</button>
      </form>

      <div className="bg-neutral-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-neutral-400">Loading projects…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-400 border-b border-neutral-700">
                <th className="p-3">Project No</th>
                <th className="p-3">Name</th>
                <th className="p-3">Location</th>
                <th className="p-3">Active</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => (
                <tr key={p.id} className="border-b border-neutral-700 last:border-0">
                  <td className="p-3">{p.project_no}</td>
                  <td className="p-3">{p.project_name}</td>
                  <td className="p-3">{p.location}</td>
                  <td className="p-3">
                    <button onClick={()=>toggleActive(p)} className={`text-xs px-2 py-1 rounded ${p.active ? 'bg-green-700' : 'bg-neutral-700'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function SuppliersTab({ onError }: { onError: (e?: string) => void }){
  const [suppliers, setSuppliers] = useState<SupplierRow[]>([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function load(){
    setLoading(true)
    const { data, error } = await supabase.from('suppliers').select('*').order('name')
    if(error) onError(error.message)
    else setSuppliers((data || []) as SupplierRow[])
    setLoading(false)
  }
  useEffect(()=>{ load() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if(!name) return
    setSaving(true)
    const { error } = await supabase.from('suppliers').insert([{ name }])
    if(error) onError(error.message)
    else { setName(''); await load() }
    setSaving(false)
  }

  return (
    <div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-4 bg-neutral-800 p-3 rounded-lg">
        <input className="p-2 rounded bg-neutral-900 text-sm flex-1" placeholder="Supplier name" value={name} onChange={e=>setName(e.target.value)} />
        <button disabled={saving} className="bg-red-600 px-4 py-2 rounded text-sm">{saving ? 'Adding…' : 'Add'}</button>
      </form>

      <div className="bg-neutral-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 text-neutral-400">Loading suppliers…</div>
        ) : suppliers.length === 0 ? (
          <div className="p-4 text-neutral-400">No suppliers yet.</div>
        ) : (
          <ul className="divide-y divide-neutral-700">
            {suppliers.map(s => <li key={s.id} className="p-3 text-sm">{s.name}</li>)}
          </ul>
        )}
      </div>
    </div>
  )
}
