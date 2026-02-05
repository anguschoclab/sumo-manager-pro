import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
 
 /**
  * Format currency (Japanese Yen) in a compact readable format.
  */
 export function formatCurrency(amount: number): string {
   if (amount >= 1_000_000) {
     return `¥${(amount / 1_000_000).toFixed(1)}M`;
   }
   if (amount >= 1_000) {
     return `¥${(amount / 1_000).toFixed(0)}K`;
   }
   return `¥${amount.toFixed(0)}`;
 }
