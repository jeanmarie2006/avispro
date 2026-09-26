import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { get, post } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { Empty, Spinner, useLoad, useToast } from '../lib/ui.jsx'
import { ReviewItem } from '../components/Parts.jsx'

export default function Moderation() {
  const { user, ready } = useAuth()
  const toast = useToast()
  const [statut, setStatut] = useState('signale')
  const resume = useLoad(() => (user?.role === 'admin' ? get('admin/resume') : Promise.resolve(null)), [user?.id])
  const list = useLoad(() => (user?.role === 'admin' ? get('admin/avis', { statut }) : Promise.resolve({ data: [] })), [statut, user?.id])
  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/connexion" replace />
  if (user.role !== 'admin') return <Navigate to="/espace" replace />

  const act = async (a, action) => {
    try { await post(`admin/avis/${a.id}/moderation`, { action }); toast(action === 'garder' ? 'Avis conservé et republié.' : 'Avis retiré.'); list.reload(); resume.reload() }
    catch (x) { toast(x.message, 'err') }
  }
  const R = resume.data
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Modération des avis</h1>
      <p className="mt-1 text-slate-600">Les entreprises signalent les avis abusifs ; vous décidez de les republier ou de les retirer.</p>
      {R && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[['Entreprises', R.entreprises], ['Avis publiés', R.avis], ['À modérer', R.signales], ['Retirés', R.masques]].map(([l, v]) => <div key={l} className="card p-4"><p className="text-xs font-bold uppercase text-slate-400">{l}</p><p className="text-2xl font-extrabold text-slate-900">{v}</p></div>)}
        </div>
      )}
      <div className="mt-6 flex gap-2">
        {[['signale', 'À modérer'], ['masque', 'Retirés']].map(([k, l]) => <button key={k} onClick={() => setStatut(k)} className={`rounded-full px-4 py-2 text-sm font-bold ${statut === k ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>{l}</button>)}
      </div>
      <section className="card mt-4 p-6">
        {list.loading && !list.data ? <Spinner /> : list.data.data.length === 0 ? <Empty icon="✅" title="Rien à modérer">Tous les signalements ont été traités.</Empty> : list.data.data.map((a) => (
          <ReviewItem key={a.id} a={a}>
            <p className="mt-3 text-xs text-slate-500">Entreprise : <Link className="font-semibold text-brand-700 hover:underline" to={`/e/${a.entreprise?.slug}`}>{a.entreprise?.nom}</Link></p>
            <p className="mt-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900"><b>Motif du signalement :</b> {a.motif_signalement}</p>
            <div className="mt-3 flex gap-2">
              <button className="btn-primary !py-2 text-xs" onClick={() => act(a, 'garder')}>✓ Garder l’avis</button>
              {statut === 'signale' && <button className="btn-danger !py-2 text-xs" onClick={() => act(a, 'masquer')}>✕ Retirer l’avis</button>}
            </div>
          </ReviewItem>
        ))}
      </section>
    </div>
  )
}
