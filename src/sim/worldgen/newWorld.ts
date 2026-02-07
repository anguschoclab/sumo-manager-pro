import { stablesState } from '../state'
import { ensureSystemsIntegrity } from './integrity'
import { bus } from '../bus'

export function newWorld(opts:{ seed:number }){
  const rand = mulberry32(opts.seed)
  const styles = ["Aimed Blows","Bashers","Lungers","Parry-Lungers","Parry-Ripostes","Parry-Strikes","Slashers","Strikers","Total Parries","Wall of Steels"]
  stablesState.stables = {}
  stablesState.warriors = {}
  stablesState.trainers = {}
  stablesState.fights = {}
  stablesState.news = []
  stablesState.calendar = { year:1, weekOfYear:1, dayOfYear:1, dayOfTournament:0 }
  for (let i=0;i<12;i++){
    const sid = "S"+i
    ;(stablesState.stables[sid] = { id: sid, name: "Stable "+(i+1) })
  }
  let wid = 0
  for (let i=0;i<80;i++){
    const id = "W"+(++wid)
    const st = "S"+Math.floor(rand()*12)
    const style = styles[i%styles.length]
    stablesState.warriors[id] = { id, name: "Warrior "+i, style, stableId: st, history: [], reputationScore: (rand()*2-1) }
  }
  stablesState.playerStable = { id: "S0", name: "Your Stable" }
  ensureSystemsIntegrity(stablesState)
  bus.emit()
}

function mulberry32(a:number){ return function(){ var t = a += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; } }
