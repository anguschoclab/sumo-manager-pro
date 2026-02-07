type CB = ()=>void
const subs = new Set<CB>()
export const bus = {
  subscribe(cb:CB){ subs.add(cb); return ()=>subs.delete(cb) },
  emit(){ for (const cb of Array.from(subs)) { try{ cb() }catch{} } }
}
