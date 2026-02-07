import * as React from "react";
import * as Toast from "@radix-ui/react-toast";

type ToastItem = { id: string; title: string; description?: string };

export const ToastContext = React.createContext<{ push: (t: Omit<ToastItem, "id">) => void } | null>(null);

export const DMToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [queue, setQueue] = React.useState<ToastItem[]>([]);
  const push = (t: Omit<ToastItem, "id">) => setQueue(q => [...q, { id: Math.random().toString(36).slice(2), ...t }] );
  const remove = (id:string) => setQueue(q => q.filter(it => it.id !== id));

  return (
    <ToastContext.Provider value={{ push }}>
      <Toast.Provider swipeDirection="right">
        {children}
        <div className="fixed bottom-4 right-4 space-y-2 z-50">
          {queue.map(it => (
            <Toast.Root key={it.id} className="bg-slate-900 text-white rounded-lg px-4 py-3 shadow-lg ring-1 ring-slate-700/50">
              <Toast.Title className="font-semibold">{it.title}</Toast.Title>
              {it.description && <Toast.Description className="text-sm opacity-80 mt-1">{it.description}</Toast.Description>}
              <Toast.Close onClick={() => remove(it.id)} className="absolute top-2 right-2 text-slate-300 hover:text-white">×</Toast.Close>
            </Toast.Root>
          ))}
        </div>
        <Toast.Viewport />
      </Toast.Provider>
    </ToastContext.Provider>
  );
};

export function useDMToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useDMToast must be used inside DMToastProvider");
  return ctx.push;
}
