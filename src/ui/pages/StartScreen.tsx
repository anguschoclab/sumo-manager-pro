import React from 'react'
import { useNavigate } from 'react-router-dom'
import { newWorld } from '../../sim/worldgen/newWorld'
import { canLoadAny, loadMostRecent } from '../../sim/persist'
import { stablesState } from '../../sim/state'
import { bus } from '../../sim/bus'

export default function StartScreen(){
  const nav = useNavigate()
  const [loading, setLoading] = React.useState(false)
  const hasSave = canLoadAny()

  const create = ()=>{
    setLoading(true)
    newWorld({ seed: Date.now() })
    stablesState.initialized = true
    bus.emit()
    nav('/', { replace:true })
  }

  const load = ()=>{
    const id = loadMostRecent()
    if (id) nav('/', { replace:true })
  }

  return (
    <div className="page" style={{maxWidth:720}}>
      <div className="card tone-hero" style={{padding:'18px 18px 14px'}}>
        <h1 className="title">Duelmasters</h1>
        <div className="sub" style={{marginTop:6}}>Forge a stable, bend the meta, and carve your legend.</div>
        <div style={{display:'flex', gap:10, marginTop:14}}>
          <button className="btn-primary" onClick={create} disabled={loading}>{loading? "Spawning World…" : "New Game"}</button>
          <button className="btn" onClick={load} disabled={!hasSave}>Load Last</button>
        </div>
      </div>
      <div className="card">
        <div className="title">How it works</div>
        <ul>
          <li>Weekly arena bouts — skipped during tournaments.</li>
          <li>15-day round-robin tournaments with playoffs if tied.</li>
          <li>Rivalries, renown vs notoriety, trainers, and meta shifts.</li>
        </ul>
      </div>
    </div>
  )
}
