import React, { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useStore } from '../hooks/useStore'

const DEFAULT_LINES = 200

export default function FightCardPage(){
  const { id } = useParams()
  const fight:any = useStore(s => s.fights?.[id!])
  const rawLog = Array.isArray(fight?.log) ? fight!.log : []
  const [expanded, setExpanded] = useState(false)
  const lines = useMemo(()=> expanded ? rawLog : rawLog.slice(-DEFAULT_LINES), [rawLog, expanded])

  if (!fight) return <div className="page"><div className="card"><div className="sub">Fight not found.</div></div></div>

  return (
    <div className="page">
      <div className="page-header"><div className="title">Fight Card</div></div>
      <div className="card fight-log" role="region" aria-live="polite">
        {lines.map((l:string, i:number)=><div key={i}>{l}</div>)}
        {rawLog.length > DEFAULT_LINES && (
          <button className="btn-ghost" aria-label="Toggle full log" onClick={()=>setExpanded(e=>!e)}>
            {expanded ? "Show last 200 lines" : `Show all (${rawLog.length})`}
          </button>
        )}
      </div>
    </div>
  )
}
