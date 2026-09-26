import { Link, NavLink, useNavigate } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth } from '../lib/auth.jsx'
import { InstallButton } from '../lib/pwa.jsx'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const link = ({ isActive }) => `rounded-lg px-3 py-2 text-sm font-semibold transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Logo />
          <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Navigation principale">
            <NavLink to="/" end className={link}>Accueil</NavLink>
            <NavLink to="/entreprises" className={link}>Entreprises</NavLink>
            {user?.role === 'entreprise' && <NavLink to="/espace" className={link}>Mon espace</NavLink>}
            {user?.role === 'admin' && <NavLink to="/moderation" className={link}>Modération</NavLink>}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <InstallButton className="btn-ghost hidden lg:inline-flex !py-2" label="⬇ Installer" />
            {user ? (
              <>
                <Link to={user.role === 'admin' ? '/moderation' : '/espace'} className="btn-ghost !py-2 md:hidden">Mon espace</Link>
                <span className="hidden text-sm font-semibold text-slate-600 sm:inline">{user.name}</span>
                <button className="btn-ghost !py-2" onClick={async () => { await logout(); nav('/') }}>Quitter</button>
              </>
            ) : (
              <>
                <Link to="/connexion" className="btn-ghost !py-2">Connexion</Link>
                <Link to="/inscription" className="btn-primary !py-2 hidden sm:inline-flex">Espace entreprise</Link>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        <p><Link to="/installer" className="font-semibold text-brand-700 hover:underline">Installer l’application</Link> · Projet de démonstration : entreprises et avis fictifs.</p>
        <p className="mt-1">Réalisé par <a className="font-semibold text-brand-700 hover:underline" href="https://sedjame-vianney.vercel.app" target="_blank" rel="noopener">Sedjame Vianney</a></p>
      </footer>
    </div>
  )
}
