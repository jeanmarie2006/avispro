import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import Company from './pages/Company.jsx'
import AuthPage from './pages/AuthPage.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Moderation from './pages/Moderation.jsx'
import Installer from './pages/Installer.jsx'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <Routes>
        <Route path="/installer" element={<Installer />} />
        <Route path="*" element={
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/entreprises" element={<Search />} />
              <Route path="/e/:slug" element={<Company />} />
              <Route path="/connexion" element={<AuthPage mode="login" />} />
              <Route path="/inscription" element={<AuthPage mode="register" />} />
              <Route path="/espace" element={<Dashboard />} />
              <Route path="/moderation" element={<Moderation />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        } />
      </Routes>
    </>
  )
}
