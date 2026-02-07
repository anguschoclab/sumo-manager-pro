
const Save:any=(globalThis as any).__dmSave;
export const ArenaHistory={append(s:any){Save?.appendArenaHistory?.(s)}, query(opts:any){return Save?.queryArenaHistory?.(opts)??[]}}; (globalThis as any).__dmArenaHistory=ArenaHistory; export default ArenaHistory;
