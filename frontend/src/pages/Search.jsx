import { useSearchParams } from 'react-router-dom'
import { get } from '../lib/api.js'
import { Empty, Spinner, useLoad } from '../lib/ui.jsx'
import { CompanyCard } from '../components/Parts.jsx'

export default function Search() {
  const [sp, setSp] = useSearchParams()
  const q = sp.get('q') || '', secteur = sp.get('secteur') || '', ville = sp.get('ville') || '', tri = sp.get('tri') || 'note', page = Number(sp.get('page') || 1)
  const filtres = useLoad(() => get('filtres'), [])
  const res = useLoad(() => get('entreprises', { q, secteur, ville, tri, page }), [q, secteur, ville, tri, page])
  const set = (k, v) => { const n = new URLSearchParams(sp); v ? n.set(k, v) : n.delete(k); if (k !== 'page') n.delete('page'); setSp(n) }
  const d = res.data

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">Entreprises</h1>
      <div className="card mt-5 grid gap-3 p-4 md:grid-cols-4" role="search">
        <input className="input md:col-span-1" placeholder="Nom, secteur, ville…" value={q} onChange={(e) => set('q', e.target.value)} aria-label="Recherche" />
        <select className="input" value={secteur} onChange={(e) => set('secteur', e.target.value)} aria-label="Secteur"><option value="">Tous les secteurs</option>{filtres.data?.secteurs.map((s) => <option key={s.secteur}>{s.secteur}</option>)}</select>
        <select className="input" value={ville} onChange={(e) => set('ville', e.target.value)} aria-label="Ville"><option value="">Toutes les villes</option>{filtres.data?.villes.map((s) => <option key={s.ville}>{s.ville}</option>)}</select>
        <select className="input" value={tri} onChange={(e) => set('tri', e.target.value)} aria-label="Tri"><option value="note">Mieux notées</option><option value="avis">Plus d’avis</option><option value="recent">Plus récentes</option></select>
      </div>
      <p className="mt-4 text-sm text-slate-500" aria-live="polite">{d ? `${d.total} résultat${d.total > 1 ? 's' : ''}` : ' '}</p>
      {res.loading && !d ? <Spinner /> : d?.data.length === 0 ? (
        <Empty icon="🔎" title="Aucune entreprise trouvée">Essayez un autre mot-clé ou retirez un filtre.</Empty>
      ) : (
        <>
          <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{d?.data.map((e) => <CompanyCard key={e.id} e={e} />)}</div>
          {d && d.last_page > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => set('page', page - 1)}>← Précédent</button>
              <span className="text-sm font-semibold text-slate-600">Page {d.current_page} / {d.last_page}</span>
              <button className="btn-ghost" disabled={page >= d.last_page} onClick={() => set('page', page + 1)}>Suivant →</button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
