/* Duelmasters — Sprint 5A delta */
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

type Toast = { id: string; text: string; tone?: "default"|"good"|"warn"; };
type Ctx = { push: (t: Omit<Toast, "id">) => void; remove: (id: string)=>void; };
const ToastsCtx = createContext<Ctx | null>(null);
export const useToasts = () => { const c = useContext(ToastsCtx); if (!c) throw new Error("ToastsProvider missing"); return c; };

export const ToastsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setItems(prev => [...prev, { id, ...t }]);
    setTimeout(() => setItems(prev => prev.filter(x => x.id != id)), 2800);
  }, []);
  const remove = useCallback((id: string) => setItems(prev => prev.filter(x => x.id != id)), []);
  const ctx = useMemo(() => ({ push, remove }), [push, remove]);
  return <ToastsCtx.Provider value={ctx}>
    {children}
    <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none">
      {items.map(t => (
        <div key={t.id} className="px-3 py-2 rounded shadow text-sm text-white pointer-events-auto"
             style={{ background: t.tone==="good" ? "#059669" : t.tone==="warn" ? "#d97706" : "#111827" }}>{t.text}</div>
      ))}
    </div>
  </ToastsCtx.Provider>;
};
