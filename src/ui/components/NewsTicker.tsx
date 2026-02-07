import React from 'react'
import { useStore } from '../hooks/useStore'

export default function NewsTicker(){
  const news:any[] = useStore(s => s.news || [])
  const raw = news.slice(-20).reverse()
  const seen = new Set<string>()
  const items = raw.filter(it => {
    const fid = (it.payload && it.payload.fightId) || it.fightId
    if (!fid) return true
    if (seen.has(fid)) return false
    seen.add(fid)
    return true
  }).slice(0,8)

  return (
    <div className="card">
      <div className="title">News</div>
      <div className="sub">{items.length? "" : "No news yet."}</div>
      <div className="ticker" style={{display:'flex', gap:8, flexWrap:'wrap', marginTop:6}}>
        {items.map(it => <span key={it.id} className="btn-ghost">{it.title}</span>)}
      </div>
    </div>
  )
}
