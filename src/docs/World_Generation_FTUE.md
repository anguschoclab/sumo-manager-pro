# Stable Lords — World Generation, Identity & FTUE Contract v1.0 (Canonical)

Date: 2026-01-06  
Status: Canonical, verbose, implementation-grade  
Scope: This document defines how a **Stable Lords world is born**, identified, and first experienced by the player. It is the authoritative contract for:

- World generation & starting state
- Initial institutional balance
- Unique ID schemas (rikishi, oyakata, stables, bouts)
- Robust shikona (ring name) generation
- FTUE (First-Time User Experience) sequencing

This document sits **below Governance/Economy Canon v2.0** and **alongside the Institutional Interaction Contract**.

---

# PART I — WORLD GENERATION PHILOSOPHY

## 1. Design Goals

World generation must:
- Produce **plausible but asymmetric** worlds
- Avoid perfect balance
- Seed long-term narrative tension
- Be deterministic and replayable
- Ensure no world is “solved” at start

> The world should already be mid-history when the player arrives.

---

## 2. Determinism & Seeding

Each world is generated from:
- `worldSeed` (64-bit integer)
- `eraPreset` (optional, default = Modern)

Given the same seed + preset:
- world topology
- identities
- starting states
are identical.

---

# PART II — INITIAL WORLD STRUCTURE

## 3. Starting Beya Distribution

Default (tunable preset):

| Category | Count |
|---|---:|
| Active Beya | 40–48 |
| Elite Beya (high prestige) | 3–5 |
| Fragile Beya (financially stressed) | 6–10 |
| New / Rebuilding Beya | 5–8 |

Each beya is seeded with:
- prestige
- kōenkai strength
- facilities
- staff
- debt state (optional)

---

## 4. Initial Rank & Competitive State

- One full **valid banzuke** is generated
- Yokozuna count: 0–3 (soft cap)
- Ōzeki count: 2–4
- Lower divisions fully populated
- Career stages mixed:
  - rising
  - peak
  - declining

No beya starts perfectly optimized.

---

## 5. Kabu Allocation at Start

- Kabu pool is fixed (per canon)
- All active beya have exactly one kabu holder
- Remaining kabu may be:
  - dormant
  - held by non-beya elders
- 10–20% of kabu flagged as “succession risk” within 3–5 years

This ensures future governance pressure.

---

# PART III — UNIQUE IDENTITY SYSTEM

## 6. Universal ID Rules

All entities receive **immutable unique IDs** at generation.
IDs never change, even if names/titles do.

IDs are:
- machine-readable
- sortable
- world-unique

---

## 7. ID Schemas

### 7.1 Rikishi ID
```
R-<WorldSeed>-<BirthYear>-<Sequence>
```

Example:
```
R-48291733-2002-0142
```

---

### 7.2 Oyakata ID
```
O-<WorldSeed>-<KabuID>
```

---

### 7.3 Beya ID
```
B-<WorldSeed>-<FoundingOrder>
```

---

### 7.4 Bout ID
```
BT-<WorldSeed>-<BashoID>-<Day>-<BoutNumber>
```

---

### 7.5 Governance Ruling ID
```
GOV-<WorldSeed>-<SequentialIndex>
```

IDs are never reused.

---

# PART IV — SHIKONA (RING NAME) GENERATION SYSTEM

## 8. Shikona Design Goals

The shikona system must:
- Feel authentically Japanese
- Avoid duplicates within a world
- Reflect stable tradition
- Support name evolution
- Be deterministic, not random chaos

---

## 9. Shikona Component Model

Each shikona is composed of:
- **Prefix** (nature, virtue, geography)
- **Core kanji** (strength, motion, aspiration)
- **Suffix** (山, 海, 川, 龍, etc.)

Example structure:
```
<Prefix><Core><Suffix>
```

---

## 10. Stable Lineage Rules

Each beya has:
- preferred kanji pool
- forbidden kanji pool
- legacy fragments from famous alumni

Example:
- Miyagino-style stables reuse 白, 鶴, 海
- Isegahama-style reuse 照, 富, 山

This creates visual lineage.

---

## 11. Duplicate Prevention

Shikona uniqueness enforced by:
- world-level registry
- phonetic similarity checks
- kanji overlap thresholds

If collision detected:
- alternate suffix applied
- secondary kanji substituted
- numeric fallback **never used**

---

## 12. Shikona Evolution Rules

Rikishi may:
- change shikona on promotion
- receive honorary kanji
- simplify or elevate name

Rules:
- must preserve some lineage
- logged permanently
- old shikona remains searchable

---

# PART V — INITIAL NPC STATE & MEMORY

## 13. Pre-Seeded Rivalries

World gen seeds:
- 5–10 stable rivalries
- 10–20 rikishi rivalries
- 2–4 oyakata political feuds

These have:
- origin stories
- mild–moderate intensity
- history timestamps

No rivalry starts at “defining.”

---

## 14. NPC Manager Profiles

NPC managers are seeded with:
- age
- philosophy
- risk tolerance
- rivalry sensitivity
- succession horizon

Some are:
- near retirement
- entrenched
- scandal-prone

---

# PART VI — FTUE (FIRST-TIME USER EXPERIENCE)

## 15. FTUE Design Goals

FTUE must:
- teach **systems through consequence**
- avoid front-loading complexity
- respect determinism
- not pause the world

> The world does not wait for the player to understand it.

---

## 16. FTUE Phases

### Phase 1 — Arrival
- Player selects beya (or is assigned)
- Intro narrative: state of the stable
- Immediate visible pressures (finances, roster)

---

### Phase 2 — First Basho
- Highlight:
  - bouts
  - kenshō
  - wins/losses
- No governance actions yet unless catastrophic

---

### Phase 3 — Consequence Reveal
- Show:
  - prestige change
  - kōenkai reaction
  - early rivalry hint

---

### Phase 4 — Governance Awareness
- Introduce:
  - sanctions warnings
  - council presence
  - long-term stakes

---

## 17. FTUE Constraints

- Player cannot be soft-locked
- Critical failure escalations delayed by one cycle
- Warnings are explicit
- No hidden punishment

---

# PART VII — VALIDATION & SAFETY

## 18. World Validation Checks

Before world is playable:
- valid banzuke
- no ID collisions
- every beya solvent ≥ 2 weeks
- at least one rivalry per top division
- kabu coverage valid

Worlds failing validation regenerate.

---

## 19. Determinism Contract

Given:
- same worldSeed
- same player choices

World evolution is identical.

---

## 20. Canon One-Liners

- **On world gen:**  
  > “You are not starting history. You are inheriting it.”

- **On shikona:**  
  > “A name is not chosen — it is earned.”

- **On FTUE:**  
  > “The game teaches by letting you fail safely.”

---

End of World Generation & FTUE Contract v1.0
