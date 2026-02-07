import React, { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useStore } from '../hooks/useStore'

const glyph = (h:any)=> h?.result?.kill ? "K" : h?.result?.method==="exhaustion" ? "E" : h?.result?.win ? "W" : "L"
const last5 = (w:any)=> (w?.history||[]).slice(-5).map(glyph).join(" ")

export default function ComparePage(){
  const [sp] = useSearchParams()
  const [left, setLeft] = useState<string>(sp.get('left')||'')
  const [right, setRight] = useState<string>(sp.get('right')||'')
  const warriors:any = useStore(s => s.warriors || {})
  const fights:any = useStore(s => s.fights || {})
  const L:any = left ? warriors[left] : null
  const R:any = right ? warriors[right] : null
  const valid = L && R && L.id !== R.id

  const h2h = useMemo(()=>{
    if (!valid) return { lWins:0, rWins:0, lPO:0, rPO:0 }
    const fix = (m:any)=>{
      if (!m.opponentId && m.id && fights[m.id]) {
        m.opponentId = fights[m.id].warriorAId===L.id ? fights[m.id].warriorBId : fights[m.id].warriorAId
      }
      return m
    }
    const lh = (L.history||[]).map(fix).filter((h:any)=>h.opponentId===R.id)
    let lWins=0, rWins=0, lPO=0, rPO=0
    lh.forEach((m:any)=>{ if (m.result?.win){ lWins++; if (m.result?.playoff) lPO++ } else { rWins++; if (m.result?.playoff) rPO++ } })
    return { lWins, rWins, lPO, rPO }
  }, [valid, L, R, fights])

  return (
    <div className="page">
      <div className="page-header">
        <div className="title">Compare Warriors</div>
        <div className="sub"><Link to="/people">People</Link> · Compare</div>
      </div>
      <div className="card">
        <div className="row" style={{gap:8}}>
          <select className="select" value={left} onChange={e=>setLeft(e.target.value)}>
            <option value="" disabled>Pick left…</option>
            {Object.values(warriors).map((w:any)=><option key={w.id} value={w.id}>{w.displayName||w.name} · {w.style}</option>)}
          </select>
          <span className="sub">vs</span>
          <select className="select" value={right} onChange={e=>setRight(e.target.value)}>
            <option value="" disabled>Pick right…</option>
            {Object.values(warriors).map((w:any)=><option key={w.id} value={w.id}>{w.displayName||w.name} · {w.style}</option>)}
          </select>
        </div>
      </div>
      {valid ? (
        <div className="compare-sheet" style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 24px 1fr', gap:'12px'}}>
          <div className="compare-col tone-lite card">
            <div className="title">{L.displayName||L.name} <span className="sub">· {L.style}</span></div>
            <div>Form: <span className="sub">{last5(L) || "—"}</span></div>
          </div>
          <div className="vs-spine" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>VS</div>
          <div className="compare-col tone-lite card">
            <div className="title">{R.displayName||R.name} <span className="sub">· {R.style}</span></div>
            <div>Form: <span className="sub">{last5(R) || "—"}</span></div>
          </div>
          <div className="card" style={{gridColumn:'1 / span 3'}}>
            <div className="title">Head-to-Head</div>
            <div className="sub">Record: {h2h.lWins}:{h2h.rWins}{(h2h.lPO||h2h.rPO)? ` (incl. playoffs ${h2h.lPO}:${h2h.rPO})` : ""}</div>
          </div>
        </div>
      ) : (
        <div className="card"><div className="sub">Pick two different warriors to compare.</div></div>
      )}
    </div>
  )
}
