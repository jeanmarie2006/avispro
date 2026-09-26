import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import Logo from '../components/Logo.jsx'
import { ApiError } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { Field } from '../lib/ui.jsx'

export default function AuthPage({ mode }) {
  const isReg = mode === 'register'
  const { user, login, register } = useAuth()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [f, setF] = useState({ name: '', email: '', password: '' })
  const [err, setErr] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to={user.role === 'admin' ? '/moderation' : '/espace'} replace />

  const enter = async (creds) => {
    setErr({}); setMsg(''); setBusy(true)
    try {
      const u = isReg && !creds ? await register(f) : await login(creds || f)
      nav(u.role === 'admin' ? '/moderation' : '/espace')
    } catch (x) {
      if (x instanceof ApiError) { setErr(Object.fromEntries(Object.entries(x.errors).map(([k, v]) => [k, v[0]]))); setMsg(x.message) } else setMsg('Erreur inattendue.')
    } finally { setBusy(false) }
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  return (
    <div className="grid min-h-[80vh] place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <form onSubmit={(e) => { e.preventDefault(); enter() }} className="card space-y-4 p-7" noValidate>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">{isReg ? 'Créer mon espace entreprise' : 'Connexion'}</h1>
            <p className="text-sm text-slate-500">{isReg ? 'Gratuit. Vous ajouterez les informations de votre entreprise juste après.' : 'Accédez à votre tableau de bord.'}</p>
          </div>
          {msg && !Object.keys(err).length && <div role="alert" className="rounded-xl bg-rose-50 px-3.5 py-2.5 text-sm font-medium text-rose-700">{msg}</div>}
          {isReg && <Field label="Votre nom" error={err.name}><input className="input" value={f.name} onChange={set('name')} autoComplete="name" /></Field>}
          <Field label="E-mail" error={err.email}><input type="email" className="input" value={f.email} onChange={set('email')} autoComplete="email" /></Field>
          <Field label="Mot de passe" error={err.password} hint={isReg ? '8 caractères minimum' : undefined}><input type="password" className="input" value={f.password} onChange={set('password')} autoComplete={isReg ? 'new-password' : 'current-password'} /></Field>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Patientez…' : isReg ? 'Créer mon compte' : 'Se connecter'}</button>
          {!isReg && (
            <div className="grid gap-2 sm:grid-cols-2">
              <button type="button" className="btn-ghost text-xs" disabled={busy} onClick={() => enter({ email: 'demo@avispro.bj', password: 'demo1234' })}>Démo : entreprise</button>
              <button type="button" className="btn-ghost text-xs" disabled={busy} onClick={() => enter({ email: 'admin@avispro.bj', password: 'admin1234' })}>Démo : modérateur</button>
            </div>
          )}
          <p className="text-center text-sm text-slate-500">
            {isReg ? <>Déjà un compte ? <Link className="font-semibold text-brand-700 hover:underline" to="/connexion">Connexion</Link></> : <>Nouvelle entreprise ? <Link className="font-semibold text-brand-700 hover:underline" to="/inscription">Créer un compte</Link></>}
          </p>
        </form>
        {sp.get('demo') && !isReg && <p className="mt-3 text-center text-xs text-slate-500">Utilisez les boutons « Démo » pour explorer sans créer de compte.</p>}
      </div>
    </div>
  )
}
