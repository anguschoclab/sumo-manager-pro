import React from 'react'
import { useStore } from '../hooks/useStore'
import NewsTicker from '../components/NewsTicker'

export default function Dashboard(){
  const cal = useStore(s => s.calendar)
  const stName = useStore(s => s.playerStable?.name || 'Your Stable')
  return (
    <div className="page">
      <div className="card"><div className="title">Welcome</div><div className="sub">Stable: {stName}</div></div>
      <NewsTicker />
      <div className="card">
        <div className="title">Today</div>
        <div className="sub">Year {cal?.year}, Week {cal?.weekOfYear}</div>
      </div>
    </div>
  )
}
