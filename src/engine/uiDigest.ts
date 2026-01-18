// uiDigest.ts
// UI Digest Builder — deterministic “what happened” summaries for UI
// Purpose:
// - Convert engine outputs (weekly/monthly boundary results, basho results, etc.) into
//   readable, grouped digest sections WITHOUT leaking hidden truth.
// - Deterministic ordering: stable sorts, no RNG.
// - Pure functions: does not mutate WorldState.
//
// Recommended usage:
// - After each sim step (day/week/month/basho end), call a builder to generate a digest payload
//   for UI panels, notifications, and logs.
//
// NOTE:
// - This module intentionally does NOT depend on Fog-of-War internals. If you want player-knowledge
//   filtering, pass in already-scouted / safe-to-display strings or set `privacyMode: "player"`.

import type { WorldState, Rikishi, Heya, Id } from "./types";
import type {
  WeeklyBoundaryResult,
  MonthlyBoundaryResult,
  TrainingEvent,
  InjuryEvent,
  SalaryPayment,
  KoenkaiIncomeEvent,
  HeyaExpense
} from "./timeBoundary";

// ==============================
// Digest Types
// ==============================

export type DigestScope = "day" | "week" | "month" | "basho";

export type DigestPrivacyMode =
  | "engine" // full information (debug/admin tools)
  | "player"; // safe, no hidden leaks (default)

// A single display line/item
export interface DigestItem {
  id: string;
  kind:
    | "training"
    | "injury"
    | "recovery"
    | "salary"
    | "koenkai"
    | "expense"
    | "economy"
    | "scouting"
    | "generic";
  title: string;
  detail?: string;
  /** Optional entity hooks for UI linking */
  rikishiId?: Id;
  heyaId?: Id;
  /** Sorting weight within section; higher shows earlier */
  priority?: number;
}

export interface DigestSection {
  id: string;
  title: string;
  items: DigestItem[];
}

export interface UIDigest {
  scope: DigestScope;
  privacyMode: DigestPrivacyMode;

  // When this digest applies (UI can show it in a timeline)
  time: {
    year: number;
    month?: number;
    weekIndexGlobal?: number;
    dayIndexGlobal?: number;
    label?: string;
  };

  headline?: string;
  sections: DigestSection[];

  // Optional, for “badge counts” in UI
  counts: {
    totalItems: number;
    trainingEvents: number;
    injuries: number;
    salaries: number;
    koenkai: number;
    expenses: number;
  };
}

// ==============================
// Public Builders
// ==============================

export function buildWeeklyDigest(args: {
  world: WorldState;
  result: WeeklyBoundaryResult;
  year: number;
  month?: number;
  weekIndexGlobal: number;
  privacyMode?: DigestPrivacyMode;
}): UIDigest {
  const privacyMode = args.privacyMode ?? "player";

  const training = buildTrainingSection(args.world, args.result.trainingEvents, privacyMode);
  const injuries = buildInjurySection(args.world, args.result.injuryEvents, privacyMode);

  const sections = compactSections([training, injuries]);

  const counts = computeCounts({
    trainingEvents: args.result.trainingEvents.length,
    injuries: args.result.injuryEvents.length,
    salaries: 0,
    koenkai: 0,
    expenses: 0
  });

  return {
    scope: "week",
    privacyMode,
    time: {
      year: args.year,
      month: args.month,
      weekIndexGlobal: args.weekIndexGlobal,
      label: `Week ${args.weekIndexGlobal}`
    },
    headline: pickHeadline(counts, {
      trainingEvents: args.result.trainingEvents.length,
      injuries: args.result.injuryEvents.length
    }),
    sections,
    counts
  };
}

export function buildMonthlyDigest(args: {
  world: WorldState;
  result: MonthlyBoundaryResult;
  year: number;
  month: number;
  privacyMode?: DigestPrivacyMode;
}): UIDigest {
  const privacyMode = args.privacyMode ?? "player";

  const salaries = buildSalarySection(args.world, args.result.salaryPayments, privacyMode);
  const koenkai = buildKoenkaiSection(args.world, args.result.koenkaiIncome, privacyMode);
  const expenses = buildExpenseSection(args.world, args.result.heyaExpenses, privacyMode);
  const economy = buildEconomySection(args.result, privacyMode);

  const sections = compactSections([salaries, koenkai, expenses, economy]);

  const counts = computeCounts({
    trainingEvents: 0,
    injuries: 0,
    salaries: args.result.salaryPayments.length,
    koenkai: args.result.koenkaiIncome.length,
    expenses: args.result.heyaExpenses.length
  });

  return {
    scope: "month",
    privacyMode,
    time: {
      year: args.year,
      month: args.month,
      label: `${monthName(args.month)} ${args.year}`
    },
    headline: pickHeadline(counts, {
      salaries: args.result.salaryPayments.length,
      koenkai: args.result.koenkaiIncome.length,
      expenses: args.result.heyaExpenses.length
    }),
    sections,
    counts
  };
}

/**
 * Convenience: build a combined digest for an "advanceWeeks" call.
 * UI can show weekly sections, plus month sections whenever they occurred.
 */
export function buildAdvanceWeeksDigest(args: {
  world: WorldState;
  weeklyResults: WeeklyBoundaryResult[];
  monthlyResults: MonthlyBoundaryResult[];
  year: number;
  startWeekIndexGlobal: number;
  startMonth?: number;
  privacyMode?: DigestPrivacyMode;
}): UIDigest {
  const privacyMode = args.privacyMode ?? "player";

  const weekItems: DigestItem[] = [];
  let weekIndex = args.startWeekIndexGlobal;

  for (const wr of args.weeklyResults) {
    weekItems.push(
      ...flattenSectionItems(buildTrainingSection(args.world, wr.trainingEvents, privacyMode)),
      ...flattenSectionItems(buildInjurySection(args.world, wr.injuryEvents, privacyMode))
    );
    weekIndex++;
  }

  const monthItems: DigestItem[] = [];
  // Month label is caller responsibility; we just summarize the totals here.
  for (const mr of args.monthlyResults) {
    monthItems.push(
      ...flattenSectionItems(buildSalarySection(args.world, mr.salaryPayments, privacyMode)),
      ...flattenSectionItems(buildKoenkaiSection(args.world, mr.koenkaiIncome, privacyMode)),
      ...flattenSectionItems(buildExpenseSection(args.world, mr.heyaExpenses, privacyMode)),
      ...flattenSectionItems(buildEconomySection(mr, privacyMode))
    );
  }

  const sections: DigestSection[] = compactSections([
    weekItems.length
      ? {
          id: "advance-weeks",
          title: `Progress Report`,
          items: sortItemsDeterministically(weekItems)
        }
      : null,
    monthItems.length
      ? {
          id: "advance-months",
          title: `Monthly Summary`,
          items: sortItemsDeterministically(monthItems)
        }
      : null
  ]);

  const counts = computeCounts({
    trainingEvents: args.weeklyResults.reduce((s, w) => s + w.trainingEvents.length, 0),
    injuries: args.weeklyResults.reduce((s, w) => s + w.injuryEvents.length, 0),
    salaries: args.monthlyResults.reduce((s, m) => s + m.salaryPayments.length, 0),
    koenkai: args.monthlyResults.reduce((s, m) => s + m.koenkaiIncome.length, 0),
    expenses: args.monthlyResults.reduce((s, m) => s + m.heyaExpenses.length, 0)
  });

  return {
    scope: "week",
    privacyMode,
    time: {
      year: args.year,
      month: args.startMonth,
      weekIndexGlobal: args.startWeekIndexGlobal,
      label: `Weeks Advanced`
    },
    headline: pickHeadline(counts, {
      trainingEvents: counts.trainingEvents,
      injuries: counts.injuries,
      salaries: counts.salaries
    }),
    sections,
    counts
  };
}

// ==============================
// Section Builders
// ==============================

function buildTrainingSection(world: WorldState, events: TrainingEvent[], privacy: DigestPrivacyMode): DigestSection | null {
  if (!events?.length) return null;

  // Group by heya, then rikishi
  const byHeya = new Map<string, TrainingEvent[]>();
  for (const e of events) {
    const r = world.rikishi.get(e.rikishiId);
    const hid = r?.heyaId ?? "unknown";
    const list = byHeya.get(hid) ?? [];
    list.push(e);
    byHeya.set(hid, list);
  }

  const items: DigestItem[] = [];
  const heyaIds = stableSort(Array.from(byHeya.keys()));

  for (const heyaId of heyaIds) {
    const heya = world.heyas.get(heyaId);
    const heyaName = heya?.name ?? heyaId;

    const list = byHeya.get(heyaId)!;
    // deterministic within heya: rikishiId then attribute
    list.sort((a, b) => {
      const c1 = a.rikishiId.localeCompare(b.rikishiId);
      if (c1 !== 0) return c1;
      const c2 = a.attribute.localeCompare(b.attribute);
      if (c2 !== 0) return c2;
      return a.description.localeCompare(b.description);
    });

    for (const e of list) {
      const r = world.rikishi.get(e.rikishiId);
      const name = r?.shikona ?? e.rikishiId;

      items.push({
        id: `train-${e.rikishiId}-${e.attribute}-${hashStable(e.description)}`,
        kind: "training",
        title: `${name} improved ${titleCase(e.attribute)} (+${e.change})`,
        detail: privacy === "engine" ? `${heyaName}: ${e.description}` : e.description,
        rikishiId: e.rikishiId,
        heyaId: heyaId,
        priority: 50
      });
    }
  }

  return {
    id: "training",
    title: "Training Report",
    items: sortItemsDeterministically(items)
  };
}

function buildInjurySection(world: WorldState, injuries: InjuryEvent[], _privacy: DigestPrivacyMode): DigestSection | null {
  if (!injuries?.length) return null;

  const sorted = [...injuries].sort((a, b) => {
    const c1 = a.severity.localeCompare(b.severity);
    if (c1 !== 0) return c1;
    const c2 = a.rikishiId.localeCompare(b.rikishiId);
    if (c2 !== 0) return c2;
    return a.weeksOut - b.weeksOut;
  });

  const items: DigestItem[] = [];
  for (const inj of sorted) {
    const r = world.rikishi.get(inj.rikishiId);
    const name = r?.shikona ?? inj.rikishiId;

    items.push({
      id: `inj-${inj.rikishiId}-${inj.severity}-${inj.weeksOut}`,
      kind: "injury",
      title: `${name} injured (${titleCase(inj.severity)})`,
      detail: `${inj.description} — out ${inj.weeksOut} week${inj.weeksOut === 1 ? "" : "s"}.`,
      rikishiId: inj.rikishiId,
      heyaId: r?.heyaId,
      priority: inj.severity === "serious" ? 100 : inj.severity === "moderate" ? 80 : 60
    });
  }

  return {
    id: "injuries",
    title: "Injuries",
    items: sortItemsDeterministically(items)
  };
}

function buildSalarySection(world: WorldState, payments: SalaryPayment[], privacy: DigestPrivacyMode): DigestSection | null {
  if (!payments?.length) return null;

  // Group by heya
  const byHeya = new Map<string, SalaryPayment[]>();
  for (const p of payments) {
    const r = world.rikishi.get(p.rikishiId);
    const hid = r?.heyaId ?? "unknown";
    const list = byHeya.get(hid) ?? [];
    list.push(p);
    byHeya.set(hid, list);
  }

  const items: DigestItem[] = [];
  for (const heyaId of stableSort(Array.from(byHeya.keys()))) {
    const heya = world.heyas.get(heyaId);
    const heyaName = heya?.name ?? heyaId;

    const list = byHeya.get(heyaId)!;
    list.sort((a, b) => a.rikishiId.localeCompare(b.rikishiId));

    let total = 0;
    for (const p of list) total += p.amount;

    items.push({
      id: `salary-${heyaId}`,
      kind: "salary",
      title: `${heyaName}: Paid out ${formatYen(total)}`,
      detail: privacy === "engine" ? `${list.length} payments processed.` : `${list.length} wrestlers received pay.`,
      heyaId,
      priority: 40
    });

    // Optional: per-rikishi lines (only in engine/debug to avoid clutter)
    if (privacy === "engine") {
      for (const p of list) {
        const r = world.rikishi.get(p.rikishiId);
        items.push({
          id: `salary-${p.rikishiId}-${p.type}`,
          kind: "salary",
          title: `${r?.shikona ?? p.rikishiId}: ${formatYen(p.amount)} (${p.type})`,
          rikishiId: p.rikishiId,
          heyaId,
          priority: 10
        });
      }
    }
  }

  return {
    id: "salaries",
    title: "Salaries & Allowances",
    items: sortItemsDeterministically(items)
  };
}

function buildKoenkaiSection(world: WorldState, income: KoenkaiIncomeEvent[], _privacy: DigestPrivacyMode): DigestSection | null {
  if (!income?.length) return null;

  const sorted = [...income].sort((a, b) => a.heyaId.localeCompare(b.heyaId));

  const items: DigestItem[] = sorted.map(k => {
    const h = world.heyas.get(k.heyaId);
    return {
      id: `koenkai-${k.heyaId}-${k.band}`,
      kind: "koenkai",
      title: `${h?.name ?? k.heyaId}: Kōenkai income ${formatYen(k.amount)}`,
      detail: `Supporter band: ${k.band}`,
      heyaId: k.heyaId,
      priority: 30
    };
  });

  return {
    id: "koenkai",
    title: "Supporters (Kōenkai)",
    items: sortItemsDeterministically(items)
  };
}

function buildExpenseSection(world: WorldState, expenses: HeyaExpense[], _privacy: DigestPrivacyMode): DigestSection | null {
  if (!expenses?.length) return null;

  const byHeya = new Map<string, HeyaExpense[]>();
  for (const e of expenses) {
    const list = byHeya.get(e.heyaId) ?? [];
    list.push(e);
    byHeya.set(e.heyaId, list);
  }

  const items: DigestItem[] = [];
  for (const heyaId of stableSort(Array.from(byHeya.keys()))) {
    const h = world.heyas.get(heyaId);
    const list = byHeya.get(heyaId)!;

    // deterministic: category order then amount
    list.sort((a, b) => {
      const c1 = a.category.localeCompare(b.category);
      if (c1 !== 0) return c1;
      return b.amount - a.amount;
    });

    const total = list.reduce((s, x) => s + x.amount, 0);

    items.push({
      id: `exp-${heyaId}`,
      kind: "expense",
      title: `${h?.name ?? heyaId}: Expenses ${formatYen(total)}`,
      detail: list.map(x => `${titleCase(x.category)} ${formatYen(x.amount)}`).join(" · "),
      heyaId,
      priority: 25
    });
  }

  return {
    id: "expenses",
    title: "Heya Expenses",
    items: sortItemsDeterministically(items)
  };
}

function buildEconomySection(month: MonthlyBoundaryResult, _privacy: DigestPrivacyMode): DigestSection | null {
  const snap = month.economySnapshot;
  if (!snap) return null;

  const items: DigestItem[] = [
    {
      id: `eco-heya`,
      kind: "economy",
      title: `Total heya funds: ${formatYen(snap.totalHeyaFunds)}`,
      priority: 20
    },
    {
      id: `eco-rikishi`,
      kind: "economy",
      title: `Total rikishi cash: ${formatYen(snap.totalRikishiFunds)}`,
      priority: 19
    },
    {
      id: `eco-runway`,
      kind: "economy",
      title: `Average runway: ${snap.avgRunwayWeeks.toFixed(1)} weeks`,
      priority: 18
    }
  ];

  return {
    id: "economy",
    title: "Economy Snapshot",
    items: sortItemsDeterministically(items)
  };
}

// ==============================
// Helpers
// ==============================

function compactSections(sections: Array<DigestSection | null>): DigestSection[] {
  return sections.filter(Boolean) as DigestSection[];
}

function flattenSectionItems(section: DigestSection | null): DigestItem[] {
  return section?.items ?? [];
}

function sortItemsDeterministically(items: DigestItem[]): DigestItem[] {
  return [...items].sort((a, b) => {
    const pa = a.priority ?? 0;
    const pb = b.priority ?? 0;
    if (pb !== pa) return pb - pa; // higher priority first
    return a.id.localeCompare(b.id);
  });
}

function stableSort(arr: string[]): string[] {
  return [...arr].sort((a, b) => a.localeCompare(b));
}

function computeCounts(base: {
  trainingEvents: number;
  injuries: number;
  salaries: number;
  koenkai: number;
  expenses: number;
}): UIDigest["counts"] {
  return {
    totalItems: base.trainingEvents + base.injuries + base.salaries + base.koenkai + base.expenses,
    trainingEvents: base.trainingEvents,
    injuries: base.injuries,
    salaries: base.salaries,
    koenkai: base.koenkai,
    expenses: base.expenses
  };
}

function pickHeadline(
  counts: UIDigest["counts"],
  hints: Partial<Record<"trainingEvents" | "injuries" | "salaries" | "koenkai" | "expenses", number>>
): string | undefined {
  if (counts.totalItems === 0) return "Quiet period.";

  const inj = hints.injuries ?? 0;
  const tr = hints.trainingEvents ?? 0;
  const sal = hints.salaries ?? 0;

  if (inj > 0) return `${inj} injury update${inj === 1 ? "" : "s"} this period.`;
  if (sal > 0) return `Monthly finances processed.`;
  if (tr > 0) return `Training progress across your stables.`;
  return `Updates recorded.`;
}

function formatYen(n: number): string {
  const v = Math.round(Number.isFinite(n) ? n : 0);
  // Use a simple formatting to avoid locale differences affecting determinism
  return `¥${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function titleCase(s: string): string {
  if (!s) return s;
  return s[0].toUpperCase() + s.slice(1);
}

function monthName(m: number): string {
  const names = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const idx = Math.max(1, Math.min(12, Math.floor(m))) - 1;
  return names[idx];
}

/** Small stable hash for IDs; not cryptographic, just deterministic. */
function hashStable(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}
