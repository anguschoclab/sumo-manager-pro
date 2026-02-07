import { stablesState } from './state'
import { ensureSystemsIntegrity } from './worldgen/integrity'
import { bus } from './bus'

export function saveToStore(name?: string){
  const id = stablesState.meta?.saveId || (crypto as any).randomUUID?.() || String(Math.random())
  stablesState.meta = { saveId: id, name: name || stablesState.meta?.name || 'Duel Save' }
  localStorage.setItem(`save_${id}`, JSON.stringify(stablesState))
  return id
}

export function loadFromStore(id: string){
  const raw = localStorage.getItem(`save_${id}`)
  if (!raw) return false
  const data = JSON.parse(raw)
  Object.assign(stablesState, data)
  ensureSystemsIntegrity(stablesState)
  stablesState.initialized = true
  bus.emit()
  return true
}

export function canLoadAny(){
  return Object.keys(localStorage).some(k => k.startsWith('save_'))
}

export function loadMostRecent(){
  const keys = Object.keys(localStorage).filter(k => k.startsWith('save_'))
  if (!keys.length) return null
  const key = keys.sort().slice(-1)[0]
  const id = key.replace('save_','')
  loadFromStore(id)
  return id
}
