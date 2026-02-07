import React from "react"
import { createRoot } from "react-dom/client"

/**
 * Stable Lords — Quickstart v1.4.1
 * - Branding update
 * - Always Playable: seed demo save if empty
 * - Safe UI: all nav pages render; buttons stubbed with hints if feature gated
 * - Tiny toast helper
 */

const SAVE_KEY = "stablelords.save.v1"

function showToast(msg) {
  const t = document.getElementById("toast")
  if (!t) return
  t.textContent = msg
  t.classList.add("show")
  setTimeout(() => t.classList.remove("show"), 1800)
}

function seedIfEmpty() {
  try {
    const existing = localStorage.getItem(SAVE_KEY)
    if (existing) return JSON.parse(existing)
  } catch {}
  const demo = {
    meta: { gameName: "Stable Lords", version: "1.4.1", createdAt: new Date().toISOString() },
    player: { owner: "You", stableName: "Demo Stable", philosophy: "Balanced" },
    fame: 2, popularity: 3, week: 1, season: "Spring",
    roster: [
      { id: "w1", name: "ORCREST", style: "PARRY-LUNGE", wins: 2, losses: 1, fame: 2, pop: 3, flair: ["Flashy"], champion: false },
      { id: "w2", name: "TARUL", style: "PARRY-RIPOSTE", wins: 1, losses: 2, fame: 1, pop: 2, flair: [], champion: false },
      { id: "w3", name: "BLOB", style: "BASHING ATTACK", wins: 0, losses: 1, fame: 0, pop: 1, flair: [], champion: false },
    ],
    newsletter: [{ week: 1, title: "Arena Chronicle", items: ["Welcome to Stable Lords!", "Demo data seeded so you can click around."] }],
    settings: { featureFlags: { tournaments: true, scouting: false } }
  }
  localStorage.setItem(SAVE_KEY, JSON.stringify(demo))
  return demo
}

function useSave() {
  const [save, setSave] = React.useState(() => seedIfEmpty())
  const persist = (next) => {
    const v = typeof next === "function" ? next(save) : next
    setSave(v)
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(v)) } catch {}
  }
  return [save, persist]
}

function Nav({ current, onNav }) {
  React.useEffect(() => {
    const els = document.querySelectorAll("[data-nav]")
    const h = (e) => onNav(e.currentTarget.getAttribute("data-nav"))
    els.forEach(el => el.addEventListener("click", h))
    return () => els.forEach(el => el.removeEventListener("click", h))
  }, [onNav])
  return null
}

function Dashboard({ save }) {
  return (
    <div className="card hero">
      <div className="title">Stable Lords</div>
      <div className="muted">Welcome back, {save?.player?.owner} — Week {save.week}, {save.season}</div>
      <div className="row" style={{marginTop:12}}>
        <span className="chip">Fame {save.fame}</span>
        <span className="chip">Popularity {save.popularity}</span>
        <span className="chip">Stable: {save.player.stableName}</span>
      </div>
    </div>
  )
}

function Roster({ save }) {
  return (
    <div className="card">
      <div className="rowb">
        <div className="title">Roster</div>
        <span className="muted">{save.roster.length} warriors</span>
      </div>
      <div className="list" style={{marginTop:10}}>
        {save.roster.map(w => (
          <div key={w.id} className="rowb" style={{borderBottom:"1px solid var(--border)",padding:"8px 0"}}>
            <div className="row">
              <strong>{w.name}</strong>
              <span className="chip">{w.style}</span>
              {w.champion ? <span className="pill">🏆 Champion</span> : null}
              {w.flair?.map(f => <span key={f} className="pill">{f}</span>)}
            </div>
            <div className="row">
              <span className="muted">{w.wins}-{w.losses}</span>
              <span className="chip">Fame {w.fame}</span>
              <span className="chip">Pop {w.pop}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RunRound({ save, setSave }) {
  const run = () => {
    // Stub: mark random fighter with a flashy moment and bump fame/popularity
    const idx = Math.floor(Math.random() * save.roster.length)
    const w = save.roster[idx]
    const updated = { ...save }
    updated.roster = save.roster.map((x,i)=> i===idx ? { ...x, fame: x.fame+1, pop: x.pop+1, flair: Array.from(new Set([...(x.flair||[]), "Flashy"])) } : x)
    updated.week += 1
    showToast(`${w.name} dazzles the crowd! Your stable’s renown grows.`)
    setSave(updated)
  }
  return (
    <div className="card">
      <div className="rowb">
        <div className="title">Run Round</div>
        <button className="btn" onClick={run}>Simulate A Round</button>
      </div>
      <div className="muted" style={{marginTop:8}}>Always Playable: this stub bumps Fame/Popularity so you can see UI flow.</div>
    </div>
  )
}

function Tournaments({ save }) {
  return (
    <div className="card">
      <div className="title">Seasonal Tournaments</div>
      <div className="muted" style={{marginTop:8}}>Feature ready in core build — UI is a minimal placeholder here.</div>
      <div className="row" style={{marginTop:12}}>
        <span className="chip">Spring Classic</span>
        <span className="chip">Summer Cup</span>
        <span className="chip">Fall Clash</span>
        <span className="chip">Winter Crown</span>
      </div>
    </div>
  )
}

function Help() {
  return (
    <div className="card">
      <div className="title">Help & Tips</div>
      <ul>
        <li><strong>OE</strong> (Offensive Effort): how hard you push for attacks.</li>
        <li><strong>AL</strong> (Activity Level): movement/tempo; affects stamina and initiative.</li>
        <li>Each style has strengths/weaknesses; experiment to find each warrior’s “sweet spot”.</li>
      </ul>
    </div>
  )
}

function ErrorBoundary({ children }) {
  const [err, setErr] = React.useState(null)
  return err ? (
    <div className="card">
      <div className="title">Something went wrong</div>
      <div className="muted" style={{marginTop:8}}>{String(err)}</div>
      <button className="btn" onClick={()=>location.reload()}>Back to Dashboard</button>
    </div>
  ) : (
    <React.Suspense fallback={<div className="card">Loading…</div>}>
      <Catcher onError={setErr}>{children}</Catcher>
    </React.Suspense>
  )
}

function Catcher({ onError, children }) {
  try { return children } catch (e) { onError(e); return null }
}

function App() {
  const [save, setSave] = useSave()
  const [tab, setTab] = React.useState("dashboard")
  React.useEffect(()=>{
    const h = (e) => setTab(e.detail)
    window.addEventListener("sl:navigate", h)
    return () => window.removeEventListener("sl:navigate", h)
  },[])
  return (
    <ErrorBoundary>
      {tab === "dashboard" && <Dashboard save={save} />}
      {tab === "roster" && <Roster save={save} />}
      {tab === "runround" && <RunRound save={save} setSave={setSave} />}
      {tab === "tournaments" && <Tournaments save={save} />}
      {tab === "help" && <Help />}
      <Nav current={tab} onNav={(dest)=>{
        window.dispatchEvent(new CustomEvent("sl:navigate",{detail:dest}))
        setTab(dest)
      }} />
    </ErrorBoundary>
  )
}

const root = createRoot(document.getElementById("app"))
root.render(<App />)

// Attach click handlers to top buttons without relying on frameworks
document.querySelectorAll("[data-nav]").forEach(btn => {
  btn.addEventListener("click", () => {
    const dest = btn.getAttribute("data-nav")
    window.dispatchEvent(new CustomEvent("sl:navigate",{detail:dest}))
  })
})
