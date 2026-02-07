/* Duelmasters — Sprint 5A delta */
import React from "react";

export const FlairChip: React.FC<{ label: string; tone?: "gold"|"blue"|"red" }> = ({ label, tone="gold" }) => (
  <span className={[
    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
    tone==="gold" ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300" : "",
    tone==="blue" ? "bg-sky-100 text-sky-800 ring-1 ring-sky-300" : "",
    tone==="red" ? "bg-rose-100 text-rose-800 ring-1 ring-rose-300" : ""
  ].join(" ")}>
    <svg viewBox="0 0 24 24" className="w-3 h-3"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z" fill="currentColor"/></svg>
    {label}
  </span>
);
