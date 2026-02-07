import { stablesState } from '../state'

export function ensureSystemsIntegrity(state:any){
  state.stables ||= {}; state.warriors ||= {}; state.trainers ||= {}; state.fights ||= {}; state.news ||= []
  state.calendar ||= { year:1, weekOfYear:1, dayOfYear:1, dayOfTournament:0 }
  for (const s of Object.values(state.stables)) { const ss:any = s; if (ss && !ss.name) ss.name = "Stable " + Math.floor(Math.random()*1000) }
  for (const w of Object.values(state.warriors)) { const ww:any = w; if (ww && !ww.name) ww.name = "Warrior " + Math.floor(Math.random()*1000) }
}
