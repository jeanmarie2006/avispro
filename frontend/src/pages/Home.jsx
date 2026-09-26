import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { get } from '../lib/api.js'
import { Spinner, useLoad } from '../lib/ui.jsx'
import { CompanyCard } from '../components/Parts.jsx'
import { useAuth } from '../lib/auth.jsx'

const ICONS = { Restaurant: '🍽️', 'Coiffure & beauté': '💇', 'Garage automobile': '🔧', Pharmacie: '💊', 'Mode & couture': '👗', Quincaillerie: '🧰', Imprimerie: '🖨️', Pâtisserie: '🎂', 'Services numériques': '💻', Santé: '🏥', 'Auto-école': '🚗', Menuiserie: '🪚', Éducation: '🎓' }

export default function Home() {
  const nav = useNavigate()
  const { user } = useAuth()
  const [q, setQ] = useState('')
  const filtres = useLoad(() => get('filtres'), [])
  const top = useLoad(() => get('entreprises', { tri: 'note' }), [])
  const go = (e) => { e.preventDefault(); nav(`/entreprises?q=${encodeURIComponent(q)}`) }

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14 md:pt-20">
          <p className="mb-4 inline-flex rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold tracking-wide">📍 La confiance des PME béninoises</p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">Les avis qui aident à bien choisir <span className="text-amber-200">près de chez vous.</span></h1>
          <p className="mt-5 max-w-2xl text-lg text-white/85">Restaurants, salons, garages, pharmacies… Lisez de vrais avis clients, ou recueillez les vôtres pour faire grandir la réputation de votre entreprise.</p>
          <form onSubmit={go} className="mt-8 flex max-w-2xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl shadow-black/20 sm:flex-row" role="search">
            <label className="sr-only" htmlFor="q">Rechercher une entreprise, un secteur ou une ville</label>
            <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex. restaurant, coiffure, Cotonou…" className="flex-1 rounded-xl px-4 py-3 text-slate-900 outline-none placeholder:text-slate-400" />
            <button className="btn-primary !py-3 px-7 text-base">Rechercher</button>
          </form>
          {filtres.data && (
            <p className="mt-5 text-sm text-white/80"><b className="text-white">{filtres.data.totaux.entreprises}</b> entreprises · <b className="text-white">{filtres.data.totaux.avis}</b> avis publiés</p>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-2xl font-extrabold text-slate-900">Parcourir par secteur</h2>
        {filtres.loading ? <Spinner /> : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtres.data?.secteurs.map((s) => (
              <Link key={s.secteur} to={`/entreprises?secteur=${encodeURIComponent(s.secteur)}`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-md">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-xl" aria-hidden="true">{ICONS[s.secteur] || '🏪'}</span>
                <span><b className="block text-sm text-slate-900">{s.secteur}</b><span className="text-xs text-slate-500">{s.total} entreprise{s.total > 1 ? 's' : ''}</span></span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex items-end justify-between"><h2 className="text-2xl font-extrabold text-slate-900">Les mieux notées</h2><Link to="/entreprises" className="text-sm font-bold text-brand-700 hover:underline">Tout voir →</Link></div>
          {top.loading ? <Spinner /> : <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{top.data?.data.slice(0, 6).map((e) => <CompanyCard key={e.id} e={e} />)}</div>}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center text-2xl font-extrabold text-slate-900">Comment ça marche ?</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[['🔍', 'Cherchez', 'Trouvez une entreprise par nom, secteur ou ville et comparez les notes.'], ['⭐', 'Donnez votre avis', 'Notez de 1 à 5 étoiles et racontez votre expérience, sans compte à créer.'], ['🛡️', 'Un avis fiable', 'Badge « avis vérifié », modération des abus et réponse publique de l’entreprise.']].map(([i, t, d]) => (
            <article key={t} className="card p-6 text-center"><div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-2xl">{i}</div><h3 className="font-extrabold text-slate-900">{t}</h3><p className="mt-1 text-sm text-slate-600">{d}</p></article>
          ))}
        </div>
      </section>

      {!user && (
        <section className="mx-auto max-w-4xl px-4 pb-20">
          <div className="rounded-3xl bg-slate-900 p-10 text-center text-white">
            <h2 className="text-3xl font-extrabold">Vous êtes une PME ou un artisan ?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-300">Créez gratuitement votre profil, répondez à vos clients, suivez votre note et intégrez vos avis sur votre propre site grâce à un widget.</p>
            <Link to="/inscription" className="btn-primary mt-6 px-7 py-3 text-base">Créer mon espace entreprise</Link>
            <p className="mt-4 text-xs text-slate-400">Essayer sans compte : <Link to="/connexion?demo=1" className="font-semibold text-white underline">connexion démo</Link></p>
          </div>
        </section>
      )}
    </>
  )
}
