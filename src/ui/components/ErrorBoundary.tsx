import React from 'react'

export class ErrorBoundary extends React.Component<{children:React.ReactNode},{err?:Error}> {
  state = { err: undefined as Error|undefined }
  static getDerivedStateFromError(err: Error){ return { err } }
  componentDidCatch(err:Error, info:any){ console.error('UI crash:', err, info) }
  render(){
    if (!this.state.err) return this.props.children
    return (
      <div className="page">
        <div className="card">
          <h3 className="title">Something went sideways.</h3>
          <div className="sub">We logged it. Try the dashboard or reload.</div>
          <button className="btn" onClick={()=>this.setState({err:undefined})}>Return</button>
        </div>
      </div>
    )
  }
}
