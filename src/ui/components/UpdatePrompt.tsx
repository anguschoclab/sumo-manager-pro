import React from 'react'
import { registerSW } from 'virtual:pwa-register'

export default function UpdatePrompt(){
  const [needRefresh, setNeedRefresh] = React.useState(false)
  const [offlineReady, setOfflineReady] = React.useState(false)

  React.useEffect(() => {
    const updateSW = registerSW({
      immediate: true,
      onNeedRefresh() { setNeedRefresh(true) },
      onOfflineReady() { setOfflineReady(true); setTimeout(()=>setOfflineReady(false), 2000) }
    })
  }, [])

  if (!needRefresh && !offlineReady) return null

  return (
    <div style={{
      position:'fixed', bottom:16, right:16, zIndex:50,
      background:'#12183b', border:'1px solid #28345f', borderRadius:10,
      color:'#e6ecff', padding:'10px 12px', boxShadow:'0 10px 24px rgba(0,0,0,.32)'
    }}>
      {offlineReady && <div>✨ Offline ready</div>}
      {needRefresh && (
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span>New version available</span>
          <button className="btn-primary" onClick={()=>location.reload()}>Reload</button>
        </div>
      )}
    </div>
  )
}
