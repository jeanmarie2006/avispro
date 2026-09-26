import { Link } from 'react-router-dom'
import { Stars, dateFr } from '../lib/ui.jsx'

const HUES = ['#f43f5e', '#f97316', '#eab308', '#10b981', '#06b6d4', '#6366f1', '#a855f7', '#ec4899']
export const hue = (s) => HUES[[...String(s)].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length]

export function Avatar({ name, size = 48 }) {
  return <span className="grid shrink-0 place-items-center rounded-2xl font-extrabold text-white" style={{ width: size, height: size, background: hue(name), fontSize: size * 0.42 }} aria-hidden="true">{name?.[0]}</span>
}

export function Rating({ value, count, big }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <b className={big ? 'text-3xl font-extrabold text-slate-900' : 'text-sm font-bold text-slate-900'}>{value ? Number(value).toFixed(1).replace('.', ',') : '—'}</b>
      <Stars value={value || 0} size={big ? 'text-2xl' : 'text-base'} />
      {count !== undefined && <span className="text-sm text-slate-500">({count} avis)</span>}
    </span>
  )
}

export function CompanyCard({ e }) {
  return (
    <Link to={`/e/${e.slug}`} className="card group flex gap-4 p-5 transition hover:-translate-y-1 hover:shadow-lg">
      <Avatar name={e.nom} />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-extrabold text-slate-900 group-hover:text-brand-700">{e.nom}</h3>
        <p className="text-xs font-semibold text-slate-500">{e.secteur} · {e.ville}</p>
        <div className="mt-1.5"><Rating value={e.note_moyenne} count={e.avis_count} /></div>
        {e.extrait && <p className="mt-2 line-clamp-2 text-sm text-slate-600">{e.extrait}</p>}
      </div>
    </Link>
  )
}

export function Distribution({ rows, total }) {
  return (
    <ul className="space-y-1.5" aria-label="Répartition des notes">
      {rows.map((r) => (
        <li key={r.note} className="flex items-center gap-3 text-sm">
          <span className="w-9 text-right font-semibold text-slate-600">{r.note} ★</span>
          <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><i className="block h-full rounded-full bg-amber-400" style={{ width: total ? `${(r.total / total) * 100}%` : 0 }} /></span>
          <span className="w-8 text-slate-500">{r.total}</span>
        </li>
      ))}
    </ul>
  )
}

export function ReviewItem({ a, children }) {
  return (
    <article className="border-b border-slate-100 py-5 last:border-0">
      <div className="flex items-start gap-3">
        <Avatar name={a.auteur} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <b className="text-slate-900">{a.auteur}</b>
            {a.verifie && <span className="badge bg-emerald-50 text-emerald-700" title="Cet avis provient d’un client ayant reçu un code de l’entreprise">✓ Avis vérifié</span>}
            <span className="text-xs text-slate-400">{dateFr(a.created_at)}</span>
          </div>
          <div className="mt-0.5"><Stars value={a.note} size="text-base" /></div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">{a.commentaire}</p>
          {a.reponse && (
            <div className="mt-3 rounded-xl border-l-4 border-brand-500 bg-brand-50/60 p-3.5 text-sm">
              <b className="text-brand-700">Réponse de l’entreprise</b> <span className="text-xs text-slate-400">· {dateFr(a.reponse.created_at)}</span>
              <p className="mt-1 text-slate-700">{a.reponse.contenu}</p>
            </div>
          )}
          {children}
        </div>
      </div>
    </article>
  )
}
