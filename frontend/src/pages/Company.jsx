import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ApiError, get, post } from '../lib/api.js'
import { Empty, Field, Spinner, Stars, useLoad, useToast } from '../lib/ui.jsx'
import { Avatar, Distribution, Rating, ReviewItem } from '../components/Parts.jsx'

export default function Company() {
  const { slug } = useParams()
  const e = useLoad(() => get(`entreprises/${slug}`), [slug])
  const [page, setPage] = useState(1)
  const avis = useLoad(() => get(`entreprises/${slug}/avis`, { page }), [slug, page])
  const [list, setList] = useState([])

  // cumule les pages d'avis (« Voir plus ») ; la page 1 remplace la liste
  useEffect(() => {
    if (!avis.data) return
    setList((l) => (avis.data.current_page === 1 ? avis.data.data : [...l, ...avis.data.data]))
  }, [avis.data])
  useEffect(() => { setPage(1); setList([]) }, [slug])

  if (e.loading && !e.data) return <Spinner />
  if (e.error) return <div className="mx-auto max-w-xl px-4 py-20"><Empty icon="😕" title="Entreprise introuvable"><Link to="/entreprises" className="btn-primary mt-4">Voir toutes les entreprises</Link></Empty></div>
  const c = e.data

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-slate-500" aria-label="Fil d’Ariane"><Link to="/" className="hover:underline">Accueil</Link> › <Link to={`/entreprises?secteur=${encodeURIComponent(c.secteur)}`} className="hover:underline">{c.secteur}</Link> › <b className="text-slate-700">{c.nom}</b></nav>
      <header className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center">
        <Avatar name={c.nom} size={80} />
        <div className="flex-1">
          <h1 className="text-3xl font-extrabold text-slate-900">{c.nom}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-500">{c.secteur} · {c.ville}{c.telephone ? ` · ${c.telephone}` : ''}</p>
          <div className="mt-2"><Rating value={c.note_moyenne} count={c.avis_count} big /></div>
        </div>
        <button type="button" className="btn-primary px-6 py-3 text-base" onClick={() => document.getElementById('donner-avis')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>★ Donner mon avis</button>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {c.description && <section className="card p-6"><h2 className="font-extrabold text-slate-900">À propos</h2><p className="mt-2 text-slate-600">{c.description}</p></section>}
          <section className="card p-6" aria-labelledby="av-t">
            <h2 id="av-t" className="text-lg font-extrabold text-slate-900">Avis clients ({c.avis_count})</h2>
            {list.length === 0 && !avis.loading ? <Empty icon="💬" title="Pas encore d’avis">Soyez le premier à partager votre expérience.</Empty> : (
              <div className="mt-2">{list.map((a) => <ReviewItem key={a.id} a={a} />)}</div>
            )}
            {avis.loading && <Spinner />}
            {avis.data && avis.data.current_page < avis.data.last_page && <button className="btn-ghost mt-3 w-full" onClick={() => setPage(page + 1)}>Voir plus d’avis</button>}
          </section>
        </div>
        <aside className="space-y-6">
          <section className="card p-6"><h2 className="mb-3 font-extrabold text-slate-900">Répartition des notes</h2><Distribution rows={c.repartition} total={c.avis_count} /></section>
          <ReviewForm slug={slug} onDone={() => { if (page === 1) avis.reload(); else setPage(1); e.reload() }} />
        </aside>
      </div>
    </div>
  )
}

function ReviewForm({ slug, onDone }) {
  const toast = useToast()
  const [f, setF] = useState({ auteur: '', note: 0, commentaire: '', code: '', website: '' })
  const [err, setErr] = useState({})
  const [busy, setBusy] = useState(false)
  const set = (k) => (ev) => setF({ ...f, [k]: ev.target.value })
  const submit = async (ev) => {
    ev.preventDefault(); setErr({})
    if (!f.note) return setErr({ note: 'Choisissez une note de 1 à 5 étoiles.' })
    setBusy(true)
    try {
      await post(`entreprises/${slug}/avis`, { ...f, code: f.code || undefined })
      toast('Merci ! Votre avis est publié.')
      setF({ auteur: '', note: 0, commentaire: '', code: '', website: '' }); onDone()
    } catch (x) {
      if (x instanceof ApiError) setErr(Object.fromEntries(Object.entries(x.errors).map(([k, v]) => [k, v[0]])) || {})
      toast(x.message, 'err')
    } finally { setBusy(false) }
  }
  return (
    <form id="donner-avis" onSubmit={submit} className="card space-y-4 p-6" noValidate>
      <h2 className="font-extrabold text-slate-900">Donner mon avis</h2>
      <div><span className="label">Votre note</span><Stars value={f.note} onChange={(n) => setF({ ...f, note: n })} size="text-3xl" />{err.note && <p role="alert" className="mt-1 text-xs font-semibold text-rose-600">{err.note}</p>}</div>
      <Field label="Votre prénom" error={err.auteur}><input className="input" value={f.auteur} onChange={set('auteur')} maxLength={60} placeholder="Ex. Koffi A." /></Field>
      <Field label="Votre expérience" error={err.commentaire} hint="Au moins 15 caractères. Restez factuel et courtois."><textarea className="input min-h-28" value={f.commentaire} onChange={set('commentaire')} maxLength={1500} /></Field>
      <Field label="Code de vérification (facultatif)" error={err.code} hint="Reçu de l’entreprise : donne le badge « avis vérifié »."><input className="input uppercase" value={f.code} onChange={set('code')} maxLength={12} placeholder="Ex. DEMO01" /></Field>
      {/* champ piège anti-robots */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}><label>Site web<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label></div>
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Envoi…' : 'Publier mon avis'}</button>
    </form>
  )
}
