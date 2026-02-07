import React, { Suspense, lazy } from 'react'
import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { useStore } from './hooks/useStore'
import { ErrorBoundary } from './components/ErrorBoundary'
import UpdatePrompt from './components/UpdatePrompt'
import InstallAppButton from './components/InstallAppButton'

const StartScreen = lazy(()=>import('./pages/StartScreen'))
const Dashboard = lazy(()=>import('./pages/Dashboard'))
const PeopleDirectory = lazy(()=>import('./pages/PeopleDirectory'))
const ComparePage = lazy(()=>import('./pages/ComparePage'))
const FightCardPage = lazy(()=>import('./pages/FightCardPage'))

export default function App(){
  const initialized = useStore(s => !!s.initialized)
  const loc = useLocation()
  const nav = useNavigate()

  React.useEffect(()=>{
    if (!initialized && loc.pathname !== '/start') nav('/start', { replace:true })
  }, [initialized, loc.pathname])

  return (
    <div className="layout">
      <header className="topbar">
        <Link to="/" className="brand">Duelmasters</Link>
        <nav className="nav">
          <Link to="/">Dashboard</Link>
          <Link to="/people">People</Link>
          <Link to="/compare">Compare</Link>
          <InstallAppButton />
        </nav>
      </header>
      <main className="content">
        <ErrorBoundary>
          <Suspense fallback={<div className="card"><div className="sub">Loading…</div></div>}>
            <Routes>
              <Route path="/start" element={<StartScreen />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/people" element={<PeopleDirectory />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/fight/:id" element={<FightCardPage />} />
              <Route path="*" element={<StartScreen />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
      <UpdatePrompt />
    </div>
  )
}
