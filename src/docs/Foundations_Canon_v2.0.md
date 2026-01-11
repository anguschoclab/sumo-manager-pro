# Stable Lords — Foundations, World Entry, UI & Observability Canon v2.0
## Definitive, Non–High-Level System Contract

Date: 2026-01-10  
Status: **ULTIMATE DEFINITIVE CANON — IMPLEMENTATION GRADE**

This document **fully consolidates and supersedes** the following documents into a single authoritative contract, with no loss of features or design intent:

- Foundations Contract v1.0 (World Boot, IDs, Shikona, FTUE)
- World Generation, Identity & FTUE Contract v1.0
- World Entry, Stable Selection & FTUE Contract v1.1
- UI Screen Map & Player Information Architecture v1.0
- Information Surfaces & Observability Contract v1.0
- Institutional Interaction Contract v1.0 (player-facing implications only)

If a rule or interaction concerns **world creation, player entry, what the player can see, how it is presented, or when it is revealed**, this document decides.

This is not a summary. This is the binding specification.

---

# PART I — FOUNDATIONAL PRINCIPLES

## 1. Core Design Axioms

1. The world exists before the player.
2. The player inherits institutions, not blank slates.
3. Information is layered, imperfect, and earned.
4. UI never reveals engine truth.
5. FTUE delays consequences, never deletes them.
6. Determinism is absolute.

> The player does not load a save.  
> The player steps into history.

---

# PART II — WORLD BOOT & GENERATION (AUTHORITATIVE)

## 2. World Boot Sequence (Non-Negotiable)

World creation proceeds in this exact order:

1. Initialize `worldSeed`
2. Initialize global registries (IDs, shikona, stables)
3. Generate beya topology
4. Allocate kabu pool
5. Seed NPC managers
6. Generate rikishi population
7. Assign shikona
8. Seed rivalries (low-to-moderate only)
9. Generate initial banzuke
10. Initialize economy state
11. Validate world
12. Enter World Entry / FTUE
13. Begin simulation tick

Failure before step 11 → regenerate world.

---

## 3. Initial World Shape

At generation:

- Active beya: 40–48
- Elite beya: 3–5
- Fragile beya: 6–10
- Rebuilding / new beya: 5–8
- Yokozuna: 0–3
- Ōzeki: 2–4

No beya begins:
- insolvent
- without a kabu holder
- without rivalry exposure

---

# PART III — GLOBAL IDENTITY SYSTEM

## 4. Immutable IDs (Canonical)

IDs are the only authoritative identity.

- RikishiID
- OyakataID
- BeyaID
- BoutID
- GovernanceRulingID
- MediaEventID

Names, titles, shikona, and nicknames are presentation-only.

IDs are:
- immutable
- never reused
- globally unique per world

---

## 5. ID Schemas

### Rikishi
```
R-<WorldSeed>-<BirthYear>-<Sequence>
```

### Oyakata
```
O-<WorldSeed>-<KabuID>
```

### Beya
```
B-<WorldSeed>-<FoundingIndex>
```

### Bout
```
BT-<WorldSeed>-<BashoID>-<Day>-<Index>
```

---

# PART IV — SHIKONA (RING NAME) SYSTEM

## 6. Shikona Registry

- All shikona registered at worldgen
- Enforces kanji + phonetic uniqueness
- Stores lineage, origin beya, aliases
- Never deletes names

---

## 7. Shikona Generation Model

Each shikona is composed of:

- Prefix (nature, virtue, geography)
- Core kanji (strength, motion, aspiration)
- Suffix (山, 川, 海, 龍, etc.)

Stable lineage defines:
- preferred kanji pool
- forbidden kanji pool
- honorary kanji eligibility

No numeric suffixes are ever used.

---

## 8. Shikona Evolution Rules

- Changes allowed only at promotion thresholds
- ≥1 lineage kanji preserved (unless honorary exception)
- Old names persist as searchable aliases
- Logged permanently in history

---

# PART V — WORLD ENTRY & STABLE SELECTION

## 9. Entry Flow

After world validation:

1. World Overview Snapshot
2. Stable Selection Phase
3. Player assignment
4. FTUE flags applied
5. Simulation begins

The world is complete before the player chooses.

---

## 10. Stable Selection Modes

The player must choose one:

### 10.1 Found a New Stable
- Player names stable (manual or random)
- Lowest prestige band
- Minimal facilities
- Weak or no kōenkai
- No sekitori
- Extreme difficulty

### 10.2 Take Over Existing Stable
- All history retained
- Finances, rivalries, debts preserved
- Existing oyakata replaced via succession rules
- Difficulty scales with stature

### 10.3 Recommended Start
- System highlights balanced stables
- Optional guidance only

---

## 11. Stable Stature (Implicit Difficulty)

Each stable displays a **Stature Card**:

| Band | Meaning | Difficulty |
|---|---|---|
| Legendary | Title contender | Very Easy |
| Powerful | Strong contender | Easy |
| Established | Stable competitor | Normal |
| Rebuilding | Declining | Hard |
| Fragile | At risk | Very Hard |
| New | No buffer | Extreme |

Derived from:
- prestige band
- financial runway band
- kōenkai strength
- roster quality
- governance pressure

Exact formulas hidden.

---

## 12. Stable Naming System

### Manual Naming
- Validated for uniqueness
- No reserved legacy names
- Immutable after confirmation

### Random Naming
- Uses shikona-style kanji generator
- Deterministic per worldSeed + click index
- Registered globally

Renaming later requires governance approval.

---

# PART VI — FTUE (FIRST-TIME USER EXPERIENCE)

## 13. FTUE Scope

FTUE lasts exactly **1 basho**.

During FTUE:
- closures suppressed
- forced mergers suppressed
- severe sanctions suppressed
- warnings logged normally
- financial stress accumulates

No consequences are erased.

---

## 14. FTUE Adaptation by Stable Choice

- Elite: expectation & scrutiny messaging
- Rebuilding/Fragile: survival & runway emphasis
- New: institution-building focus

---

# PART VII — OBSERVABILITY & FOG-OF-WAR

## 15. Information Layers

Every variable exists as:

1. Engine Truth
2. Observed Data
3. Estimated State
4. Presented View

Only the engine accesses layer 1.

---

## 16. Observability Rules (Binding)

- Players and NPCs share the same knowledge layer
- Scouting generates estimates with confidence decay
- Rivalry biases interpretation, not truth
- UI uses qualitative bands, never raw numbers

---

## 17. Prohibited Leaks

UI must never expose:
- hidden thresholds
- exact probabilities
- internal AI weights
- engine truth

---

# PART VIII — UI ARCHITECTURE

## 18. Global Navigation Tabs

Stable | Banzuke | Basho | Rikishi | Rivalries | Scouting | Economy | Governance | History | World

---

## 19. Screen Design Rules

- Headline → Context → Detail
- Opt-in depth
- Explicit warnings
- Trend-first presentation

---

## 20. Key Screen Contracts (Summary)

- **Stable**: prestige, runway, kōenkai, risks
- **Banzuke**: ranks, awards, rival markers
- **Basho**: torikumi, results, kenshō
- **Rikishi**: career, style (inferred), journals
- **Scouting**: estimates, confidence, decay
- **Economy**: bands, runway, obligations
- **Governance**: sanctions, rulings, history
- **History**: immutable journals
- **World**: macro context

---

# PART IX — DETERMINISM & VALIDATION

## 21. World Validation Checklist

Before play:
- valid banzuke
- unique IDs
- no beya < 2 weeks runway
- kabu coverage valid
- rivalry minimums met

Failure regenerates world.

---

## 22. Determinism Contract

Given:
- same worldSeed
- same player choices

World evolution and UI output are identical.

---

# PART X — CANON PHRASES

- “You inherit problems, not options.”
- “If the player can see it, the world can see it.”
- “Names change. IDs do not.”
- “The interface is a lens, not a dashboard.”

---

**End of Foundations, World Entry, UI & Observability Canon v2.0**
