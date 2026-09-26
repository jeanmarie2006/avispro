import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ApiError, BASE, get, post, put } from '../lib/api.js'
import { useAuth } from '../lib/auth.jsx'
import { Empty, Field, Modal, Spinner, Stars, useLoad, useToast } from '../lib/ui.jsx'
import { Distribution, Rating, ReviewItem } from '../components/Parts.jsx'

const TABS = [['apercu', '📊 Aperçu'], ['avis', '💬 Avis'], ['codes', '🔑 Codes vérifiés'], ['widget', '🧩 Widget'], ['profil', '🏢 Profil']]
const MOIS = ['janv', 'févr', 'mars', 'avr', 'mai', 'juin', 'juil', 'août', 'sept', 'oct', 'nov', 'déc']

export default function Dashboard() {
  const { user, ready } = useAuth()
  const [tab, setTab] = useState('apercu')
  const mine = useLoad(() => (user?.role === 'entreprise' ? get('mon-entreprise') : Promise.resolve(null)), [user?.id])
  if (!ready) return <Spinner />
  if (!user) return <Navigate to="/connexion" replace />
  if (user.role === 'admin') return <Navigate to="/moderation" replace />
  if (mine.loading && !mine.data) return <Spinner />
  if (!mine.data) return <Onboarding onDone={mine.reload} />
  const e = mine.data

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-extrabold text-slate-900">{e.nom}</h1><div className="mt-1"><Rating value={e.note_moyenne ? Math.round(e.note_moyenne * 10) / 10 : null} count={e.avis_count} /></div></div>
        <Link to={`/e/${e.slug}`} className="btn-ghost">Voir ma page publique ↗</Link>
      </div>
      <nav className="mt-5 flex gap-1.5 overflow-x-auto pb-1" aria-label="Sections">
        {TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} aria-current={tab === k} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${tab === k ? 'bg-brand-600 text-white shadow' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'}`}>{l}</button>)}
      </nav>
      <div className="mt-6">
        {tab === 'apercu' && <Overview />}
        {tab === 'avis' && <Reviews />}
        {tab === 'codes' && <Codes />}
        {tab === 'widget' && <Widget slug={e.slug} />}
        {tab === 'profil' && <Profile e={e} onSaved={mine.reload} />}
      </div>
    </div>
  )
}

function Kpi({ label, value, hint, tone = 'text-slate-900' }) {
  return <div className="card p-5"><p className="text-xs font-bold uppercase tracking-wide text-slate-400">{label}</p><p className={`mt-1 text-3xl font-extrabold ${tone}`}>{value}</p>{hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}</div>
}

function Overview() {
  const s = useLoad(() => get('mon-entreprise/stats'), [])
  if (s.loading) return <Spinner />
  const d = s.data
  const max = Math.max(1, ...d.evolution.map((m) => m.total))
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Note moyenne" value={d.moyenne ? `${String(d.moyenne).replace('.', ',')} / 5` : '—'} tone="text-amber-500" hint={`${d.total} avis publiés`} />
        <Kpi label="Avis vérifiés" value={d.verifies} tone="text-emerald-600" hint="Avec code de vérification" />
        <Kpi label="Sans réponse" value={d.sans_reponse} tone={d.sans_reponse ? 'text-brand-600' : 'text-slate-900'} hint="Répondre améliore votre image" />
        <Kpi label="En modération" value={d.signales} hint="Avis que vous avez signalés" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6" aria-labelledby="ev-t">
          <h2 id="ev-t" className="font-extrabold text-slate-900">Avis reçus par mois</h2>
          <div className="mt-6 flex gap-3" role="img" aria-label="Histogramme du nombre d’avis par mois">
            {d.evolution.map((m) => (
              <div key={m.mois} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="h-4 text-xs font-bold text-slate-700">{m.total || ''}</span>
                <div className="flex h-36 w-full items-end"><div className="w-full rounded-t-lg bg-gradient-to-t from-brand-600 to-brand-500" style={{ height: `${Math.max(m.total ? 4 : 1, (m.total / max) * 100)}%`, opacity: m.total ? 1 : .25 }} /></div>
                <span className="text-xs text-slate-500">{MOIS[Number(m.mois.slice(5)) - 1]}</span>
                <span className="h-4 text-[11px] font-semibold text-amber-500">{m.moyenne ? `${String(m.moyenne).replace('.', ',')}★` : ''}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="card p-6"><h2 className="mb-4 font-extrabold text-slate-900">Répartition des notes</h2><Distribution rows={d.repartition} total={d.total} /></section>
      </div>
    </div>
  )
}

function Reviews() {
  const toast = useToast()
  const [statut, setStatut] = useState('')
  const [page, setPage] = useState(1)
  const r = useLoad(() => get('mon-entreprise/avis', { statut, page }), [statut, page])
  const [reply, setReply] = useState(null) // {avis, text}
  const [flag, setFlag] = useState(null)
  const [busy, setBusy] = useState(false)

  const sendReply = async () => {
    setBusy(true)
    try { await post(`avis/${reply.avis.id}/reponse`, { contenu: reply.text }); toast('Réponse publiée.'); setReply(null); r.reload() }
    catch (x) { toast(x instanceof ApiError ? x.all() : x.message, 'err') } finally { setBusy(false) }
  }
  const sendFlag = async () => {
    setBusy(true)
    try { await post(`avis/${flag.avis.id}/signaler`, { motif: flag.text }); toast('Avis signalé : il est retiré en attendant la modération.'); setFlag(null); r.reload() }
    catch (x) { toast(x instanceof ApiError ? x.all() : x.message, 'err') } finally { setBusy(false) }
  }
  const STAT = { publie: null, signale: ['bg-amber-50 text-amber-700', 'En modération'], masque: ['bg-slate-100 text-slate-600', 'Retiré'] }

  return (
    <section className="card p-6">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-extrabold text-slate-900">Vos avis</h2>
        <select className="input !w-auto" value={statut} onChange={(e) => { setStatut(e.target.value); setPage(1) }} aria-label="Filtrer par statut"><option value="">Tous</option><option value="publie">Publiés</option><option value="signale">En modération</option><option value="masque">Retirés</option></select>
      </div>
      {r.loading && !r.data ? <Spinner /> : r.data.data.length === 0 ? <Empty icon="💬" title="Aucun avis">Partagez le lien de votre page pour recevoir vos premiers avis.</Empty> : (
        <>
          {r.data.data.map((a) => (
            <ReviewItem key={a.id} a={a}>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {STAT[a.statut] && <span className={`badge ${STAT[a.statut][0]}`}>{STAT[a.statut][1]}</span>}
                {a.statut === 'publie' && <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={() => setReply({ avis: a, text: a.reponse?.contenu || '' })}>{a.reponse ? '✎ Modifier ma réponse' : '↩ Répondre'}</button>}
                {a.statut === 'publie' && <button className="btn-ghost !px-3 !py-1.5 text-xs text-rose-600" onClick={() => setFlag({ avis: a, text: '' })}>⚑ Signaler</button>}
                {a.motif_signalement && a.statut !== 'publie' && <span className="text-xs text-slate-500">Motif : {a.motif_signalement}</span>}
              </div>
            </ReviewItem>
          ))}
          {r.data.last_page > 1 && <div className="mt-4 flex items-center justify-center gap-3"><button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button><span className="text-sm">Page {r.data.current_page}/{r.data.last_page}</span><button className="btn-ghost" disabled={page >= r.data.last_page} onClick={() => setPage(page + 1)}>→</button></div>}
        </>
      )}
      {reply && (
        <Modal title="Répondre publiquement" onClose={() => setReply(null)}>
          <p className="mb-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">« {reply.avis.commentaire} »</p>
          <Field label="Votre réponse" hint="Soyez courtois : elle sera visible par tous."><textarea className="input min-h-28" autoFocus value={reply.text} onChange={(e) => setReply({ ...reply, text: e.target.value })} /></Field>
          <div className="mt-4 flex gap-2"><button className="btn-ghost flex-1" onClick={() => setReply(null)}>Annuler</button><button className="btn-primary flex-1" disabled={busy || reply.text.length < 5} onClick={sendReply}>Publier</button></div>
        </Modal>
      )}
      {flag && (
        <Modal title="Signaler cet avis" onClose={() => setFlag(null)}>
          <p className="mb-3 text-sm text-slate-600">Un modérateur examinera l’avis. En attendant, il n’est plus affiché publiquement.</p>
          <Field label="Motif du signalement"><textarea className="input min-h-24" autoFocus value={flag.text} onChange={(e) => setFlag({ ...flag, text: e.target.value })} placeholder="Ex. propos injurieux, avis publicitaire, client inconnu…" /></Field>
          <div className="mt-4 flex gap-2"><button className="btn-ghost flex-1" onClick={() => setFlag(null)}>Annuler</button><button className="btn-danger flex-1" disabled={busy || flag.text.length < 5} onClick={sendFlag}>Signaler</button></div>
        </Modal>
      )}
    </section>
  )
}

function Codes() {
  const toast = useToast()
  const c = useLoad(() => get('mon-entreprise/codes'), [])
  const gen = async (n) => { try { await post('mon-entreprise/codes', { nombre: n }); toast(`${n} code${n > 1 ? 's' : ''} généré${n > 1 ? 's' : ''}.`); c.reload() } catch (x) { toast(x.message, 'err') } }
  return (
    <section className="card p-6">
      <h2 className="font-extrabold text-slate-900">Codes de vérification</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">Remettez un code à un client (sur son ticket, par SMS ou WhatsApp). S’il le saisit en laissant son avis, celui-ci reçoit le badge <b className="text-emerald-700">✓ Avis vérifié</b>. Chaque code n’est utilisable qu’une fois.</p>
      <div className="mt-4 flex gap-2"><button className="btn-primary" onClick={() => gen(1)}>＋ 1 code</button><button className="btn-ghost" onClick={() => gen(5)}>＋ 5 codes</button></div>
      {c.loading && !c.data ? <Spinner /> : (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {c.data.map((k) => (
            <li key={k.id} className={`flex items-center justify-between rounded-xl border px-4 py-3 ${k.utilise_le ? 'border-slate-200 bg-slate-50 text-slate-400' : 'border-emerald-200 bg-emerald-50'}`}>
              <code className={`text-lg font-extrabold tracking-widest ${k.utilise_le ? 'line-through' : 'text-emerald-800'}`}>{k.code}</code>
              <span className="text-xs font-semibold">{k.utilise_le ? 'Utilisé' : 'Disponible'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function Widget({ slug }) {
  const toast = useToast()
  const root = BASE
  const snippet = `<div data-avispro="${slug}"></div>\n<script src="${root}widget.js" async></script>`
  return (
    <section className="card p-6">
      <h2 className="font-extrabold text-slate-900">Widget à intégrer sur votre site</h2>
      <p className="mt-1 max-w-2xl text-sm text-slate-600">Collez ce code là où vous voulez afficher votre note et vos derniers avis (site vitrine, WordPress, Wix…).</p>
      <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-sm text-emerald-300"><code>{snippet}</code></pre>
      <button className="btn-primary mt-3" onClick={() => { navigator.clipboard?.writeText(snippet); toast('Code copié.') }}>Copier le code</button>
      <h3 className="mb-2 mt-7 text-sm font-extrabold text-slate-700">Aperçu</h3>
      <iframe title="Aperçu du widget" className="h-80 w-full max-w-md rounded-xl border border-slate-200 bg-white" srcDoc={`<!doctype html><body style="margin:16px;font-family:sans-serif">${snippet.replace('async', '')}</body>`} />
    </section>
  )
}

function Profile({ e, onSaved }) {
  const toast = useToast()
  const [f, setF] = useState({ nom: e.nom, secteur: e.secteur, ville: e.ville, description: e.description || '', telephone: e.telephone || '', site_web: e.site_web || '' })
  const [err, setErr] = useState({})
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value })
  const save = async (ev) => {
    ev.preventDefault(); setErr({})
    try { await put('mon-entreprise', { ...f, site_web: f.site_web || null }); toast('Profil enregistré.'); onSaved() }
    catch (x) { if (x instanceof ApiError) setErr(Object.fromEntries(Object.entries(x.errors).map(([k, v]) => [k, v[0]]))); toast(x.message, 'err') }
  }
  return <CompanyForm f={f} set={set} err={err} onSubmit={save} label="Enregistrer" title="Profil de l’entreprise" />
}

function CompanyForm({ f, set, err, onSubmit, label, title, busy }) {
  return (
    <form onSubmit={onSubmit} className="card grid max-w-3xl gap-4 p-6 sm:grid-cols-2" noValidate>
      <h2 className="text-lg font-extrabold text-slate-900 sm:col-span-2">{title}</h2>
      <Field label="Nom de l’entreprise" error={err.nom} className="sm:col-span-2"><input className="input" value={f.nom} onChange={set('nom')} /></Field>
      <Field label="Secteur d’activité" error={err.secteur}><input className="input" value={f.secteur} onChange={set('secteur')} placeholder="Restaurant, Garage…" list="secteurs" /></Field>
      <datalist id="secteurs">{['Restaurant', 'Coiffure & beauté', 'Garage automobile', 'Pharmacie', 'Mode & couture', 'Quincaillerie', 'Imprimerie', 'Pâtisserie', 'Services numériques', 'Santé', 'Éducation'].map((s) => <option key={s} value={s} />)}</datalist>
      <Field label="Ville" error={err.ville}><input className="input" value={f.ville} onChange={set('ville')} placeholder="Cotonou" /></Field>
      <Field label="Description" error={err.description} className="sm:col-span-2"><textarea className="input min-h-24" value={f.description} onChange={set('description')} placeholder="Présentez vos produits et services." /></Field>
      <Field label="Téléphone" error={err.telephone}><input className="input" value={f.telephone} onChange={set('telephone')} placeholder="+229 …" /></Field>
      <Field label="Site web" error={err.site_web}><input className="input" value={f.site_web} onChange={set('site_web')} placeholder="https://…" /></Field>
      <div className="sm:col-span-2"><button className="btn-primary" disabled={busy}>{label}</button></div>
    </form>
  )
}

function Onboarding({ onDone }) {
  const toast = useToast()
  const [f, setF] = useState({ nom: '', secteur: '', ville: '', description: '', telephone: '', site_web: '' })
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value })
  const submit = async (ev) => {
    ev.preventDefault(); setErr({}); setBusy(true)
    try { await post('mon-entreprise', { ...f, site_web: f.site_web || null }); toast('Votre entreprise est en ligne !'); onDone() }
    catch (x) { if (x instanceof ApiError) setErr(Object.fromEntries(Object.entries(x.errors).map(([k, v]) => [k, v[0]]))); toast(x.message, 'err') } finally { setBusy(false) }
  }
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-extrabold text-slate-900">Bienvenue ! Présentez votre entreprise</h1>
      <p className="mb-6 text-slate-600">Ces informations apparaîtront sur votre page publique, où vos clients pourront laisser leurs avis.</p>
      <CompanyForm f={f} set={set} err={err} onSubmit={submit} label="Publier mon entreprise" title="Informations" busy={busy} />
    </div>
  )
}
