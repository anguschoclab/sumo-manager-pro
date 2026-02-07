import React from 'react'

export default function InstallAppButton(){
  const [deferred, setDeferred] = React.useState<any>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(()=>{
    const handler = (e:any)=>{
      e.preventDefault()
      setDeferred(e)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler as any)
    return ()=> window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])

  if (!visible) return null

  const onInstall = async ()=>{
    if (!deferred) return
    deferred.prompt()
    const choice = await deferred.userChoice
    setVisible(false)
    setDeferred(null)
    console.log('PWA install choice', choice)
  }

  return (
    <button className="btn-ghost" onClick={onInstall} title="Install app">Install App</button>
  )
}
