import { Link } from 'react-router-dom'

export default function Logo({ to = '/', light = false }) {
  return (
    <Link to={to} className={`flex items-center gap-2.5 font-extrabold tracking-tight ${light ? 'text-white' : 'text-slate-900'}`} aria-label="AvisPro Bénin — accueil">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-md shadow-brand-600/30">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.500 9.400l6.600-.9z" /></svg>
      </span>
      <span className="text-lg">Avis<span className={light ? 'text-brand-100' : 'text-brand-600'}>Pro</span> <span className={`text-xs font-bold uppercase tracking-widest ${light ? 'text-white/70' : 'text-slate-400'}`}>Bénin</span></span>
    </Link>
  )
}
