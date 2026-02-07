import React from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList as List } from 'react-window'
import { useStore } from '../hooks/useStore'

export default function PeopleDirectory(){
  const rows:any[] = useStore(s => Object.values(s.warriors||{}).map((w:any)=>({ id:w.id, name:w.displayName||w.name, style:w.style, rep:(typeof w.reputationScore==='number'? w.reputationScore : 0) })))

  const Row = ({ index, style, data }: any) => {
    const r = data.rows[index]
    return (
      <div style={style} className="tr tone-lite">
        <div className="td">{r.name}</div>
        <div className="td">{r.style}</div>
        <div className="td">{r.rep>0? "Renowned" : r.rep<0? "Notorious" : "Balanced"}</div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-header"><div className="title">People Directory</div></div>
      <div className="card">
        <div className="table">
          <div className="thead tr">
            <div className="th">Warrior</div><div className="th">Class</div><div className="th">Reputation</div>
          </div>
          <div style={{height:420}}>
            <AutoSizer>
              {({height,width})=>(
                <List height={height} width={width} itemCount={rows.length} itemSize={40}
                      itemData={{ rows }} itemKey={(i,d)=> d.rows[i].id}>
                  {Row}
                </List>
              )}
            </AutoSizer>
          </div>
        </div>
      </div>
    </div>
  )
}
