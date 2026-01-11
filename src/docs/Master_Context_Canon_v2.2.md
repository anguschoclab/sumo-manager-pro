# Stable Lords — MASTER CONTEXT CANON v2.2
## Granular Definitive Constitution (Harmonized Spec + Source Preservation Annex)

Date: 2026-01-10  
Status: **DEFINITIVE / IMPLEMENTATION-GRADE / NON–HIGH-LEVEL**

This version exists because prior v2.0/v2.1 outputs were too condensed.  
v2.2 is explicitly designed to be:

- **Totally granular** (every system has inputs → process → outputs → state changes → logs)
- **Non-lossy** (no feature can be dropped accidentally)
- **Larger than the full source set** by including a **verbatim Source Preservation Annex**

If anything in the harmonized spec is ambiguous, the annex provides the exact original phrasing.

---

## How to use this document

- **Part A (Harmonized Granular Spec):** the single authoritative contract for implementation.
- **Part B (Data Contracts & Tables):** explicit schemas, enumerations, and deterministic rules.
- **Part C (Resolution & Precedence Rules):** how conflicts are resolved.
- **Part D (Source Preservation Annex):** full source documents embedded verbatim (completeness guarantee).

---

## Precedence Rules (Binding)

When consolidating legacy docs, precedence is:

1. **v2.2 Part A/B** (this file) — authoritative.
2. If v2.2 is silent: newest Clean Canon (v1.4 → v1.1).
3. If still silent: Consolidated v0.4.1.
4. If still silent: v0.4.0 FULL then v0.4.0 short.

However, Part D preserves all text for traceability.

---

# PART A — Harmonized Granular Spec (Authoritative)

## A1. Design Laws

### A1.1 Determinism (Absolute)
**Definition:** Any system that evolves state must be a pure function of:
- current WorldState snapshot
- explicit player inputs for the tick
- explicit random seed(s) derived deterministically from WorldSeed + event keys

**Forbidden:** runtime RNG, non-seeded noise, time-of-day dependencies.

**Required output for every state-changing system:**
- `EventLogRow[]` appended to the immutable ledger (see B4)
- `StateDiff` applied atomically

### A1.2 Narrative-First UI (Absolute)
The player surface is primarily language. Numbers are permitted only in:
- economy amounts (yen)
- rank / record (wins-losses, division labels, basho day)
- time (dates, weeks)

Everything else must be expressed as:
- qualitative bands
- descriptors
- inferred confidence language (scouting)

**Hard prohibition:** raw attribute values, hidden thresholds, probability outputs.

### A1.3 Institutions Over Individuals
Stables, governance, sponsors, rivalries and records persist beyond careers.
Every system must write to history.

---

## A2. Time & Tick Model (Exact)

### A2.1 Calendar
- 6 basho/year: Hatsu, Haru, Natsu, Nagoya, Aki, Kyushu
- Basho phase: **15 daily ticks**
- Inter-basho: **6 weekly ticks**

### A2.2 Tick Order (Global)
The global simulation tick order is fixed. At each tick, systems run in this order:

1. **Input ingestion**
   - player decisions locked
   - NPC decision pass locked (see A12)
2. **Institutional constraints**
   - governance restrictions applied (if active)
   - foreign-slot constraints enforced
3. **Economy pass**
   - incomes apply (cadence dependent)
   - expenses apply
   - loan schedules (interest/principal)
   - insolvency state machine update
4. **Roster & staff administrative pass**
   - promotions/retirements queued
   - releases/joins resolved
5. **Training & recovery pass** (weekly, not daily)
6. **Combat pass** (daily during basho)
   - torikumi generation or retrieval
   - bout resolution and logs
7. **Awards pass** (basho end)
8. **Rankings pass** (basho end)
9. **Narrative rendering pass**
   - PBP, headlines, journals
10. **History & analytics persistence**
    - finalize immutable ledger rows for the tick

Any doc that describes a different ordering is overridden by this canonical order.

---

## A3. Entity Identity & Registries (Immutable)

### A3.1 Entities and IDs
All major entities have immutable IDs; names are presentation.

Required registries:
- `RikishiRegistry`
- `BeyaRegistry`
- `OyakataRegistry`
- `SponsorRegistry`
- `BoutRegistry`
- `EventLedger` (immutable)

### A3.2 ID Formats (Recommended; stable per world)
- RikishiID: `R-<worldSeed>-<birthYear>-<seq>`
- BeyaID: `B-<worldSeed>-<foundingIndex>`
- OyakataID: `O-<worldSeed>-<kabuIdOrSeq>`
- SponsorID: `S-<worldSeed>-<tier>-<seq>`
- BoutID: `BT-<worldSeed>-<bashoId>-<day>-<index>`
- GovernanceRulingID: `G-<worldSeed>-<tick>-<seq>`
- MediaEventID: `M-<worldSeed>-<tick>-<seq>`

### A3.3 Uniqueness Rules
- IDs never reused.
- Shikona uniqueness enforced at registry level (see A6).
- Stable names unique; can be duplicated only if governance explicitly authorizes a “revival” (dormant hook).

---

## A4. World Generation (Granular)

### A4.1 Worldgen Inputs
- WorldSeed
- WorldSizeScalar (defaults to 1)
- DifficultyPreset (optional; affects only recommended stable list, not simulation physics)

### A4.2 Worldgen Outputs
- Fully populated registries
- Initial banzuke
- Initial financial state (per stable)
- Initial supporters (kōenkai) state
- Initial sponsor pool
- Initial rivalries (low-to-moderate only)
- FTUE flags

### A4.3 Worldgen Steps (Detailed)
1. Create registries and counters
2. Generate stables (39–45 target)
3. Assign each stable:
   - region
   - baseline facilities band
   - baseline prestige band
4. Generate kabu/oyakata pool (if governance dormant, still create IDs and placeholders)
5. Generate NPC managers for AI-run stables:
   - archetype
   - trait vector
6. Generate rikishi population:
   - age distribution
   - physique potentials
   - temperament
7. Assign each rikishi to a stable roster based on stable profile
8. Generate shikona (registry enforced)
9. Seed initial rivalries:
   - 0–2 per stable (low intensity)
   - 0–1 per notable rikishi (if any)
10. Generate initial banzuke from strength estimates (no “perfect truth”)
11. Initialize economy:
   - stable budgets
   - supporter bands
   - existing debts (rare; never immediate bankruptcy)
12. Validate world invariants (B6 checklist)
13. Enter World Entry flow (A5)

---

## A5. World Entry, Stable Selection & FTUE (Granular)

### A5.1 Player Entry Choices
The player chooses exactly one:
1) **Found new stable**
2) **Take over existing stable**
3) **Recommended start** (curated list; still chooses an existing stable)

### A5.2 Found New Stable
Player must:
- choose stable name or click Random

**Random naming**
- deterministic: `hash(worldSeed, clickIndex)` selects from the stable-name generator pools
- must pass uniqueness check; if collision, deterministic disambiguation rule applied

New stable starts with:
- lowest prestige band
- minimal facilities band
- weak/no kōenkai
- no sekitori
- roster size minimal (configurable; recommended 6–10 recruits)

### A5.3 Take Over Existing Stable (FM-style difficulty)
The stable selection screen shows:
- stable name
- stature band (qualitative difficulty)
- short descriptor (one sentence)
- risk icons: finance, governance pressure, rivalry heat

Detail panel shows:
- supporters band
- facilities band
- recent narrative record
- rivalries (publicly known)
- governance watch status (publicly known)

**No hidden numbers exposed.**

### A5.4 FTUE Flags (1 basho)
FTUE prevents terminal outcomes but logs everything:
- closures suppressed
- forced mergers suppressed
- severe sanctions suppressed
- insolvency can occur, but “terminal collapse” is delayed

FTUE messaging adapts to chosen stable stature:
- elite: expectation pressure
- fragile: survival guidance
- new: institution-building framing

---

## A6. Shikona System (Granular)

### A6.1 Registry Guarantees
- global uniqueness for active shikona
- alias history stored permanently
- lineage kanji preferences per stable

### A6.2 Generation Inputs
- rikishi birth region
- stable lineage pool
- worldSeed
- sequence counters

### A6.3 Generation Process
1. Select pattern (prefix+core+suffix) weighted by stable lineage
2. Construct kanji + romaji
3. Validate uniqueness
4. If collision:
   - apply deterministic alternate suffix
   - then alternate prefix
   - then rare honorific insertion (if allowed)
5. Register and attach to rikishi

### A6.4 Evolution
Allowed at:
- sekitori promotion thresholds
- major career events (yūshō, scandal redemption) if enabled
Rules:
- must preserve ≥1 lineage kanji unless honorary exception
- old shikona becomes alias
- governance approval may be required when governance active

---

## A7. Rikishi Model (Granular)

### A7.1 Stored State
- physique: heightCurrent, weightCurrent, potentials, growth profile
- age and career time
- health: injury state machine
- fatigue state
- momentum/form state
- style inference state
- archetype bias state
- favorite kimarite tendencies (emergent)

### A7.2 Growth & Physique
Growth is processed weekly:
- height grows early; weight can grow longer
- growth fulfillment ∈ [0,1] approaches 1 with diminishing returns
Modifiers:
- training plan (from Training doc, referenced)
- facility bands
- injuries
- age phase

### A7.3 Career Phase Computation
Not shown numerically. Derived from age and performance trend bands:
- Prospect
- Rise
- Prime
- Decline
- Exit

Phase affects:
- recovery speed band
- injury susceptibility band
- consistency band
- narrative tone templates

---

## A8. Combat Engine V3 (Context Contract Level)

The master canon does not replace the Combat Engine spec; it binds interfaces.

### A8.1 Engine Inputs (Per Bout)
- rikishi A state snapshot
- rikishi B state snapshot
- venue modifiers (ritual only)
- bout importance tags (for PBP and sponsors)
- deterministic BoutSeed

### A8.2 Engine Outputs (Per Bout)
- winnerId
- kimariteId (82 registry)
- durationBand (instant/short/medium/long)
- position story tokens (center/edge/reversal)
- special ruling token (none/mono-ii/torinaoshi/mizui-iri)
- injury events (if any)
- fatigue deltas
- narrative cue tokens for PBP

Engine outputs must be logged in the immutable ledger.

---

## A9. Banzuke, Scheduling, Awards (Binding Interfaces)

### A9.1 Scheduling
- torikumi pairing rules are deterministic
- east/west precedence
- avoidance rules for repeated matchups (unless late-basho contention demands)

### A9.2 Promotions/Demotions
Deterministic heuristics by division; no human “committee magic” unless governance layer explicitly enabled.

### A9.3 Awards
At basho end:
- yūshō / jun-yūshō
- sanshō categories
- trophy list integration as flavor (no balance impact beyond prestige/economy hooks)

Awards feed:
- prestige band changes
- sponsors interest changes
- narrative headlines

---

## A10. Economy & Supporters (Binding Interfaces)

The master canon binds the economy system at a contract level; the dedicated economy doc owns amounts.

### A10.1 Money Cadence
- Salaries monthly
- Allowances monthly
- Kenshō per bout
- Supporters monthly
- Facilities expenses weekly/monthly (as defined)

### A10.2 Salary Routing Rule (Realism)
Sekitori salaries belong to rikishi personal account, **not** directly to stable operating budget.
Stable operating budget relies on:
- supporters (kōenkai)
- oyakata subsidies
- sponsorship flows (kenshō share)
- ticket/appearance revenue (if modeled)
- loans/benefactors

### A10.3 Insolvency State Machine
States:
- Stable → Tight → Critical → Insolvent → Rescued / Closed / Merged
No random bankruptcy; all steps are warned and logged.

---

## A11. Sponsors (Procedural) and Kenshō Ceremony Linkage (Binding)

Sponsors exist as persistent entities with tiers and lifecycles.
Sponsors appear in:
- kenshō banners (per bout)
- kōenkai member lists (monthly)
- benefactor/loan identities (crisis)

Sponsor selection is deterministic and respects:
- tier budgets by bout importance
- cooldowns (avoid repetition)
- scandal tolerance and withdrawal

---

## A12. NPC Manager AI (Binding Interfaces)

NPC managers make decisions weekly using:
- perception snapshots (no cheating)
- rivalry pressure distortions
- meta drift narratives
- finance mood bands

Outputs:
- recruit/release intents
- facility investment intents
- foreign slot intents
- scandal mitigation intents
- succession recommendations

All decisions logged.

---

## A13. Governance (Dormant but Canonical Hooks)

Governance V1 exists as forward-declared but may be inactive.
Even when dormant:
- IDs exist
- UI placeholders exist
- history ledger is compatible

When active, governance controls:
- kabu availability
- sanctions
- merger/closure arbitration
- scandal escalation

---

## A14. Narrative Systems (Binding Interfaces)

### A14.1 PBP
PBP consumes combat outputs and sponsor banner assignments to produce:
- flowing narrative without phase headings
- explicit kimarite mention
- optional mono-ii/torinaoshi/mizui-iri branches
- sponsor banner mention slots
- kenshō envelope ceremony text
- crowd reaction and crowd memory callbacks
- text variety via descriptor sets + cooldown

### A14.2 Career Journals & Headlines
- deterministic headline phrase engine
- journal entries written at key thresholds:
  - promotion milestones
  - rivalry peaks
  - scandals and redemptions
  - retirement

---

# PART B — Data Contracts & Tables (Expanded)
(See annex for verbatim legacy tables. This part defines the normalized v2.2 schemas.)

## B1. WorldState Schema (Normalized)
```ts
WorldState {
  worldId: string
  worldSeed: string
  calendar: CalendarState
  registries: Registries
  stables: Record<BeyaID, Beya>
  rikishi: Record<RikishiID, Rikishi>
  sponsors: Record<SponsorID, Sponsor>
  governance: GovernanceState
  economy: EconomyState
  banzuke: BanzukeState
  narrative: NarrativeState
  ledger: EventLedger
}
```

## B2. Beya Schema (Normalized)
```ts
Beya {
  beyaId: BeyaID
  name: BeyaName
  regionId: RegionID
  statureBand: StatureBand
  prestigeBand: PrestigeBand
  facilitiesBand: FacilitiesBand
  koenkai: KoenkaiState
  roster: RikishiID[]
  staff: StaffState
  finances: BeyaFinanceState
  rivalries: RivalryID[]
  history: HistoryRefs
}
```

## B3. Sponsor Schema (Normalized)
(See sponsor doc annex; this includes tier, category, traits, relationships.)

## B4. EventLedger Row (Immutable)
```ts
EventLogRow {
  tickId: TickID
  type: string
  subjectId: string
  objectId?: string
  tags: string[]
  payload: Record<string, any>   // must be schema-versioned
}
```

## B5. Qualitative Bands (Standardized Enumerations)
- PrestigeBand: `legendary|powerful|established|rebuilding|fragile|new`
- FinanceMood: `flush|tight|danger`
- GovernancePressure: `none|watch|active|crisis`
- ScandalHeat: `low|medium|high|inferno`
- InjuryMood: `contained|worrying|spiraling`
- SupportersBand: `none|weak|moderate|strong|powerful`

## B6. World Validation Checklist (Hard)
- Unique IDs
- Unique active shikona
- Valid banzuke sizes per division
- No stable begins Insolvent
- Kabu placeholders valid
- Minimum roster size per stable met
- Sponsor pool present
- Ledger initialized

---

# PART C — Conflict Resolution Notes (Granular)

## C1. How conflicts were resolved
- v2.0 was compressed; v2.2 restores detail using v1.2 verbose as baseline.
- Any time a newer doc used narrative-first language that omitted mechanics, mechanics are preserved from older docs and narrative-first constraints are applied on top.
- Where two docs disagree about a number: economy doc is authoritative for money; banzuke doc for rank sizes; combat engine spec for combat.

---

# PART D — Source Preservation Annex (Verbatim, Non-Lossy)

This annex embeds the full text of each source document to guarantee that:
- no feature is missed
- nothing is “lost in translation”
- the combined file is not smaller than the source set

Each source is included under a collapsible-style heading.

---


## SOURCE — Stable_Lords_Master_Context_Canon_v2.0_Ultimate.md

```md
# Stable Lords — Master Context Canon v2.0
## Definitive, Narrative‑First, Fully‑Specified Design Bible

Date: 2026‑01‑07  
Status: **ULTIMATE CANON — SINGLE SOURCE OF TRUTH**  
Supersedes:
- Master Context v0.4.0
- Consolidated Context v0.4.1
- Clean Canon v1.1, v1.2, v1.3, v1.4

---

## PURPOSE OF THIS DOCUMENT

This document **fully merges and reconciles** all prior Master Context and Clean Canon documents into **one explicit, implementation‑grade contract**.

It is:
- **not high‑level**
- **not aspirational**
- **not a roadmap**

It is the **binding truth** of how Stable Lords works.

If something is not specified here, it is either:
- intentionally undefined, or
- forbidden

---

# PART I — CORE DESIGN CONTRACTS

## 1. Narrative‑First Presentation Contract (Binding)

Stable Lords is not presented as a spreadsheet simulator.

Internally:
- the engine is numeric
- outcomes are deterministic
- logs are exact

Externally:
- the player sees **language, tone, implication, and consequence**
- numbers appear **only** where institutionally unavoidable

### 1.1 Where Numbers MAY Appear
Numbers are allowed **only** in:
- economy (yen, salaries, debts)
- rankings & records (wins/losses, rank names)
- time (days, weeks, basho count)

### 1.2 Forbidden Numeric Leakage
Raw values must **never** be shown for:
- attributes
- fatigue, morale, injury risk
- growth ceilings
- prestige
- rivalry heat
- AI intent or confidence
- governance thresholds

Breaking this rule is a design bug.

---

## 2. Pillars (Final Form)

### Pillar 1 — Authentic Institutions
Sumo is conservative, hierarchical, political, and slow‑moving.

Rules are learned through:
- repetition
- consequence
- narrative framing

### Pillar 2 — Deterministic Simulation
Given the same:
- world seed
- player inputs
- event stream

…the world resolves identically.

### Pillar 3 — Emergent Narrative
The game never scripts drama.
It **records and remembers** it.

### Pillar 4 — Always Playable
The game must always boot, load, and simulate safely, even with dormant systems.

---

# PART II — WORLD & TIME

## 3. Time Model

- 6 basho per year:
  - Hatsu, Haru, Natsu, Nagoya, Aki, Kyushu
- Basho time: **daily** (Day 1–15)
- Interim time: **weekly** (6 weeks)

No real‑time dependency exists.

---

## 4. World Structure

### 4.1 Flexible Stable Count
- Initial: ~42 stables (range 39–45)
- Ongoing soft bounds: 35–50

### 4.2 Core Entities
- WorldState
- Heya (stable)
- Rikishi
- Oyakata
- BashoState
- Bout
- Rivalry
- Sponsor / Supporter (procedural)

All entities have immutable IDs.

---

# PART III — STABLES (BEYA)

## 5. Beya Lifecycle

### 5.1 Founding
A new stable may be founded when:
- a retired rikishi meets eligibility
- elder stock access exists (when governance active)
- minimum funds/facilities met
- world cap allows

Founding produces:
- a new institutional identity
- baseline prestige
- seeded facilities
- narrative “founding moment”

### 5.2 Succession
Triggered on:
- retirement
- death
- disqualification

Pipeline:
1. build candidate pool
2. score candidates (prestige, loyalty, finances, conduct)
3. governance check (if active)
4. successor approved OR failure

### 5.3 Closure & Merger
If succession fails:
- closure is default
- merger is optional (future‑active)

Closures redistribute rikishi and generate historical records.

---

# PART IV — RIKISHI SYSTEM

## 6. Permanent Identity

Each rikishi has:
- immutable ID
- unique shikona (registry enforced)
- origin metadata

Shikona are generated deterministically from weighted syllable pools.

---

## 7. Physique & Growth

Each rikishi stores:
- current height/weight
- potential height/weight
- growth fulfillment scalar
- growth profile (early/late/steady)

Not all rikishi reach potential.

Growth depends on:
- age
- training
- injuries
- facilities

---

## 8. Career Phases

Phases are **implicit**, not shown numerically:
- Prospect
- Rise
- Prime
- Decline
- Exit

Narrative language communicates phase.

---

## 9. Style & Archetype

### 9.1 Tactical Archetypes (Behavior Bias)
- Oshi Specialist
- Yotsu Specialist
- Speedster
- Trickster
- All‑Rounder

Archetype is a bias layer, not destiny.

### 9.2 Style (Emergent Label)
- oshi
- yotsu
- hybrid

Style recalculates over time based on:
- physique
- kimarite usage
- grip success

---

## 10. Dynamic State

### Fatigue
- accumulates per bout and training
- recovers in interim
- affects initiative and injury risk

### Momentum
- short‑term form scalar
- rises from streaks and upsets
- decays naturally

### Injuries
- deterministic
- stateful
- visible with recovery timelines

---

# PART V — COMBAT ENGINE V3

## 11. Bout Phases
1. Tachiai
2. Stance / Grip
3. Momentum ticks
4. Finisher window
5. Resolution + log

---

## 12. Kimarite System (82)

- Full official registry
- Filtered by stance, grip, position
- Weighted by:
  - style
  - archetype
  - favorites
  - rarity dampening

Favorites (tokui‑waza) emerge naturally.

---

# PART VI — RANKINGS & BASHO

## 13. Banzuke
- Authentic hierarchy
- Deterministic promotion heuristics
- Correct bout counts

## 14. Awards & Kensho
- Yusho, jun‑yusho, sansho
- Kensho banners attach to bouts
- Ceremony narrated in PBP

---

# PART VII — ECONOMY & PRESTIGE

## 15. Economy (Numeric Core)

Includes:
- monthly sekitori salaries
- allowances for lower ranks
- kensho payouts
- retirement funds
- supporter income
- loans & benefactors

Failure is deterministic, never random.

---

## 16. Prestige (Narrative Scalar)
Prestige is never shown numerically.

It affects:
- sponsor interest
- media tone
- governance scrutiny
- recruitment ease

---

# PART VIII — INFORMATION & AI

## 17. Scouting & Fog‑of‑War
- incomplete information by default
- revealed through observation and rivalry
- expressed as analyst language

---

## 18. NPC Manager AI

Managers have:
- profiles
- risk tolerance
- adaptation lag
- rivalry awareness

AI responds to meta drift and scandals deterministically.

---

# PART IX — NARRATIVE SYSTEMS

## 19. Play‑by‑Play (PBP)
- ritual framing (salt throws, shikiri)
- flowing narration
- kimarite reveal
- kensho ceremony
- crowd & memory reactions

---

## 20. Career Journals & Media
- journals auto‑generated
- headlines selected deterministically
- scandals and governance recorded permanently

---

# PART X — FORWARD SYSTEMS

## 21. Dormant but Canonical
- Governance V1
- Kabu system
- Stable mergers
- Advanced media
- Analytics dashboards

Dormant systems may narrate, but never surprise.

---

# FINAL CONTRACT

Internally:
- exact numbers
- exact logs
- reproducibility

Externally:
- implication
- memory
- consequence

> “You do not manage numbers. You manage institutions.”

---

END OF MASTER CONTEXT CANON v2.0

```



## SOURCE — Stable_Lords_Master_Context_Clean_Canon_v1.4_Definitive.md

```md
# Stable Lords — Master Context (Clean Canon v1.4)
## Narrative‑First, Fully‑Specified, Implementation Canon

Date: 2026‑01‑06  
Status: **Definitive Canon**  
Supersedes:
- Clean Canon v1.2 — Full Verbose
- Clean Canon v1.3 — Narrative‑First Edition

---

## How This Document Is Structured

This document **merges the full mechanical completeness of v1.2** with the **explicit narrative‑first presentation contract of v1.3**.

**Rule of precedence inside this document:**
- Mechanical rules from v1.2 are preserved unless explicitly overridden.
- Presentation, UI, and player‑facing interpretation follow the narrative‑first rules below.
- Internal simulation remains numeric and deterministic at all times.

If a conflict exists:
> **Mechanics stay numeric. Presentation becomes narrative.**

---

# 0. Narrative‑First Presentation Contract (Binding)

Stable Lords is not presented as a spreadsheet simulation.  
It is presented as a **living chronicle of sumo institutions, careers, and decline**.

### 0.1 Engine vs Player Reality
- The engine uses precise numbers.
- The player consumes **language, tone, trends, and consequence**.
- Numbers appear only where money, rank, or time demand them.

> “The truth exists underneath. The player lives on the surface.”

### 0.2 Where Numbers Are Allowed
Raw numbers may appear **only** in:
- Economy ledgers (yen, salaries, debts, runway)
- Rankings & records (wins/losses, rank titles)
- Time (basho count, days, weeks)

All other values must be:
- banded
- comparative
- trend‑based
- described verbally

### 0.3 Forbidden Numeric Leakage
Never expose raw values for:
- attributes
- fatigue, morale, injury risk
- growth ceilings
- rivalry heat
- prestige
- governance thresholds
- AI confidence or intent

Breaking this rule is a design bug.

---

# 1. Core Vision & Pillars

(From v1.2, clarified narratively)

### Pillar 1 — Authentic Institutions
Sumo is:
- conservative
- hierarchical
- political
- tradition‑bound

Rules are inferred through outcomes, not tooltips.

### Pillar 2 — Deterministic Simulation
Nothing is random.
Everything is reproducible under seed + state + choice.

### Pillar 3 — Emergent Narrative
The game never scripts drama.
It **remembers** it.

### Pillar 4 — Always Playable
The game must always boot, load, and remain navigable, even with dormant systems.

---

# 2. Canonical Tech Stack
*(Unchanged from v1.2 — authoritative)*

[Full tech stack preserved verbatim]

---

# 3. Determinism Rules
*(Unchanged from v1.2 — authoritative)*

- World Seed
- Deterministic divergence
- Forbidden nondeterminism

---

# 4. World Structure & Time
*(Unchanged from v1.2, harmonized with World Generation Contract)*

- ~42 stables, flexible bounds
- 6 basho per year
- day‑based basho, week‑based interim

---

# 5. Beya System
*(Preserved mechanically, narrated institutionally)*

Founding, succession, closure, and mergers remain **rule‑driven**, but surfaced as:
- council deliberations
- lineage stories
- institutional failure or survival arcs

---

# 6. Rikishi Identity & Career System
*(Full v1.2 mechanics retained)*

### 6.1 Permanent Identity
- Immutable ID
- Unique shikona (registry‑enforced)
- Origin metadata

### 6.2 Career Phases
Youth → Rise → Prime → Decline → Exit

Phases are **never shown numerically**.
They are implied through:
- commentary
- consistency
- recovery speed
- narrative framing

---

# 7. Physique, Fatigue, Momentum & Injuries
*(Full mechanical model retained)*

### Presentation Rule
Players never see:
- fatigue values
- injury probabilities
- momentum numbers

Instead they see:
- body language
- form commentary
- recovery notes
- visible injuries with timelines

---

# 8. Combat Engine V3
*(Mechanically identical to v1.2)*

### Narrative Override
Combat logs are rendered as **story beats**:
- tachiai clash
- control shift
- decisive moment
- finish framing

The kimarite remains official; execution is narrated.

---

# 9. Banzuke & Rankings
*(Unchanged mechanically)*

- Authentic hierarchy
- Deterministic promotion heuristics
- Records shown numerically (allowed)

Narrative framing emphasizes:
- pressure
- expectation
- consequences of rank

---

# 10. 82‑Kimarite System
*(Fully preserved from v1.2)*

Registry, weighting matrices, stance biases, and tokui‑waza mechanics remain unchanged.

**Presentation rule:**  
Players learn tendencies through repetition and commentary, not probability tables.

---

# 11. Economy, Prestige & Rivalries

### 11.1 Economy (Numeric Core)
Salaries, kenshō, debt, loans, runway remain explicit numbers.

### 11.2 Prestige (Narrative Scalar)
Prestige is **never shown numerically**.
It is implied via:
- banner frequency
- media tone
- recruitment ease
- governance attention

### 11.3 Rivalries
Rivalry heat is hidden.
Importance is conveyed via:
- headline frequency
- commentary language
- crowd reaction
- AI behavior shifts

---

# 12. Scouting & Fog‑of‑War

*(Mechanics preserved; presentation narrative)*

Scouting reports read like analyst notes:
- “Appears vulnerable late.”
- “Struggles on the belt.”
- “Condition seems inconsistent.”

Confidence is verbal, not numeric.

---

# 13. Narrative Consumption Layer

Narrative is a **consumer**, never a driver.

Inputs:
- bout logs
- rivalries
- seasonal tone
- injuries
- governance events

Outputs:
- headlines
- journals
- retrospectives
- commentary

All deterministic.

---

# 14. Data Contracts & Helpers
*(Preserved from v1.2)*

Types, helpers, kimarite registry remain authoritative.

---

# 15. Forward‑Declared Systems
*(Preserved and aligned with narrative contract)*

- Governance V1
- Mergers
- Loans & benefactors
- Career journals & analytics

Dormant systems may produce **narrative signals only**, never hidden outcomes.

---

# 16. Final Developer Contract

Internally:
- numbers are precise
- logs are exact
- determinism is absolute

Externally:
- the player sees meaning, not machinery
- uncertainty is explicit
- explanation follows consequence

> “You don’t manage numbers. You manage consequences.”

---

**End of Clean Canon v1.4 — Definitive Narrative‑Mechanical Canon**

```



## SOURCE — Stable_Lords_Master_Context_Clean_Canon_v1.3_Narrative_First.md

```md
# Stable Lords — Master Context (Clean Canon v1.3 — Narrative-First Edition)

Date: 2026-01-06  
Status: Canonical, narrative-first, implementation-ready  
Supersedes: Clean Canon v1.2 (Full Verbose)

Purpose:  
This document is the **definitive design bible** for Stable Lords, rewritten to explicitly enforce a **narrative-first presentation philosophy**.  
The simulation remains fully deterministic and numeric internally, but the *player-facing experience* is deliberately **thematic, descriptive, and story-driven**, with **hard numbers shown only where economically necessary**.

If there is a conflict between *numeric transparency* and *narrative readability*, **narrative readability wins** (except for explicit economic ledgers).

---

## 0. Narrative-First Contract (NEW)

### 0.1 Core Rule
Stable Lords is not presented as a spreadsheet.  
It is presented as **a living chronicle of sumo institutions and careers**.

- The engine uses numbers.
- The UI uses *language*.
- The player reasons in *stories and trends*, not raw stats.

> “The truth exists underneath. The player lives on the surface.”

---

### 0.2 Where Numbers Are Allowed
Numbers may be shown **only** in:
- **Economy ledgers** (yen amounts, salaries, debts, runway)
- **Rankings & records** (wins/losses, rank titles)
- **Time** (basho count, days, weeks)

Everywhere else, values must be:
- banded
- comparative
- trend-based
- described in prose

---

### 0.3 Forbidden Numeric Leakage
The following must *never* be shown as raw numbers:
- attributes (strength, balance, stamina)
- fatigue, morale, injury risk
- growth potential
- rivalry heat
- prestige
- governance thresholds
- AI confidence or intent

---

## 1. Core Vision & Pillars (Narrative Clarified)

### Pillar 1 — Authentic Institutions
The world behaves like real sumo:
- tradition-bound
- hierarchical
- conservative
- slow to change
- rich in subtext

Rules exist, but they are **rarely explained directly**. They are inferred through outcomes, commentary, and consequences.

---

### Pillar 2 — Deterministic, Explainable Simulation
Nothing is random.
Everything can be explained *after the fact*.

But the explanation is framed as:
- “He looked heavy-footed late”
- “The stable seems to be losing its edge”
- “Momentum abandoned him at the rope”

—not as equations.

---

### Pillar 3 — Narrative Consumption, Not Narrative Control
The player does not author stories.  
The player **manages an institution**, and the narrative *emerges*.

The game never invents drama.
It remembers it.

---

## 2. Presentation Philosophy by System

### 2.1 Rikishi Attributes (Narrative Bands)

Attributes are described as:
- “overwhelmingly strong”
- “technically refined”
- “still raw”
- “showing wear”
- “dangerous in short exchanges”

Each phrase maps deterministically to an internal band.

The mapping is consistent, but hidden.

---

### 2.2 Fatigue, Form, and Injuries

Instead of numbers, the UI uses:
- body language
- commentary cues
- recovery notes
- trainer observations

Examples:
- “His legs looked heavy today.”
- “He struggled to reset after the initial clash.”
- “Still favoring the knee.”

Exact values remain invisible.

---

### 2.3 Style & Evolution

Style is presented as **identity**, not math:
- “A relentless pusher.”
- “Comfortable on the belt.”
- “Adapting toward control as he ages.”

Style drift is narrated as *career evolution*, not stat change.

---

## 3. Combat & Bout Narrative

### 3.1 Phase Logs as Story Beats
Each bout produces:
- tachiai description
- control shift
- decisive moment
- finish framing

Example:
> “They collided hard, but it was Takamori who gave ground first.  
> Shirogane stayed patient, waited for the opening, and forced him out at the edge.”

The underlying engine is unchanged; only the *voice* matters.

---

### 3.2 Kimarite Presentation
The official kimarite is shown, but:
- accompanied by descriptive flavor
- contextualized (“late”, “counter”, “on the straw”)
- framed as habit (“another classic yorikiri”)

Players learn tendencies through repetition, not tooltips.

---

## 4. Economy (Exception: Numbers Are Explicit)

Economy is the **one place** where numbers are sacred:
- salaries
- kenshō
- debts
- loans
- runway

This is intentional:
- money is the *hard constraint*
- institutions die from cash, not vibes

However, *impact* is still narrated:
- “Supporters are losing faith.”
- “The books are tightening.”
- “This feels unsustainable.”

---

## 5. Rivalries & Institutional Memory

Rivalries are described as:
- “quiet tension”
- “bad blood”
- “unfinished business”
- “a defining feud”

Heat is never shown.

Players understand importance through:
- headline frequency
- commentary tone
- crowd reaction language
- AI behavior shifts

---

## 6. Governance & Scandals (Language First)

Governance is presented formally:
- notices
- warnings
- rulings
- decisions

But severity is conveyed through **language and ceremony**, not meters:
- “The council has taken note…”
- “This matter will not be ignored.”
- “The decision is final.”

---

## 7. Scouting & Fog-of-War (Narrative Intelligence)

Scouting reports read like analysis, not data dumps:
- “Appears vulnerable to lateral movement.”
- “Struggles when forced into prolonged grapples.”
- “Condition seems to dip late in tournaments.”

Confidence is expressed verbally:
- “Early read”
- “Consistent pattern”
- “Well-established tendency”

---

## 8. Career Journals & History (Chronicle Tone)

Journals are written as **career chronicles**, not timelines:
- chapters
- turning points
- rises and declines
- rivalries as arcs

Example:
> “This basho marked the beginning of his long rivalry with Kiyonoumi, a pairing that would define both careers.”

---

## 9. World Tone & Seasonal Flavor

Seasonal tone influences:
- commentary
- injury framing
- crowd descriptions
- fatigue narration

Winter is harsh.  
Summer is grinding.  
Autumn is tense.  
Spring feels hopeful.

No mechanical explanation is given unless necessary.

---

## 10. UI Language Rules (Binding)

- Prefer verbs over adjectives
- Prefer trends over snapshots
- Prefer comparisons over absolutes
- Prefer implication over explanation

If a tooltip explains *why* something happened, it must do so narratively first.

---

## 11. Developer Contract (Important)

Internally:
- numbers are precise
- determinism is strict
- debugging tools may expose truth

Externally:
- the player never sees the machinery
- the illusion of a living world is preserved

Breaking this contract is a design bug.

---

## 12. Canon One-Liners (Expanded)

- “You don’t manage numbers. You manage consequences.”
- “Careers end quietly long before they end officially.”
- “The most dangerous decline is the one you don’t notice.”
- “Money kills stables. Pride kills careers.”

---

End of Clean Canon v1.3 — Narrative-First Edition

```



## SOURCE — Stable_Lords_Master_Context_Clean_Canon_v1.2_FULL_VERBOSE.md

```md
# Stable Lords / SumoGame — Master Context (Clean Canon v1.2 — Full)

Date: 2026-01-06  
Purpose: A **sprint-free**, restart-ready, fully explicit design bible describing the entire game, its systems, and the canonical tech/design contracts.

> This document is intended to be copy/pasted into a fresh chat as the full game context, and also used as the canonical reference for implementation.

---

## Table of Contents
1. Core Vision & Pillars  
2. Canonical Tech Stack (Stable Lords Tech Spec v1.0)  
3. Determinism Rules (Deterministic but Divergent)  
4. World Structure (including flexible beya count)  
5. Time, Calendar, and the Six-Basho Loop  
6. Beya (Stable) System: Founding, Succession, Closure  
7. Rikishi Identity, Growth, Style Evolution, and Career Phases  
   7.10 Dynamic State Attributes (Fatigue, Momentum, Injuries)  
8. Combat Engine V3 (Deterministic): Phase Model, Logs, Counters  
9. Banzuke (Ranking) System: Hierarchy and Promotion Heuristics  
10. The 82-Kimarite System (Option A): Registry + Weighting Matrix  
11. Economy: Kenshō, Prestige, Stable Funds, Retirement Funds  
   11.3 Rivalries  
   11.4 Scouting & Fog of War  
   11.5 Seasonal Tone & World Flavor  
12. Narrative Consumption Layer (Formalized)  
13. Data Contracts (Types) and Helper Modules  
   13.4 Kimarite Aliases and Post-Processing Labels  
14. Forward-Declared Systems (Canonical but Dormant)
---

# 1. Core Vision & Pillars (Canonical)

## Pillar 1 — Authenticity
Stable Lords is a **sumo management simulation** grounded in authentic structures:
- **Six basho per year**: Hatsu, Haru, Natsu, Nagoya, Aki, Kyushu.
- **Authentic rank hierarchy**: Yokozuna → Jonokuchi, with correct bout counts per division.
- **Kenshō banners**, payouts, and retirement funds as a core economic loop.
- **Beya-centered world** (stable culture, succession, reputation, facilities).

## Pillar 2 — Deterministic Simulation
- Every outcome is repeatable given the same **World Seed** and the same sequence of player choices.
- Combat is deterministic under seeded RNG (seedrandom), with **data-driven endings** from the 82-kimarite registry.

## Pillar 3 — Narrative-First
- Every bout generates a structured log of phases and pivotal moments.
- Systems (rivalries, seasonal tone, scandals, succession) are explicitly designed to produce “headlines” and story hooks.
- The sim should feel like it creates drama *without* scripting outcomes.

## Pillar 4 — Always Playable
- The build must boot locally and remain navigable at all times.
- Missing features must be guarded and degrade gracefully:
  - seeded demo data
  - stubbed services
  - safe UI states, empty-state copy, and error boundaries
  - offline-friendly packaging patterns

---

# 2. Canonical Tech Stack (Stable Lords Tech Spec v1.0)

**Frontend Core**
- React (Vite) + TypeScript
- Zustand + Immer (state)
- Tailwind + Radix UI (layout/controls/dialogs)
- React Router (navigation)
- React Hook Form (configuration flows)

**Simulation Systems**
- Custom TypeScript sim engine
- seedrandom for deterministic outcomes
- Comlink + Web Workers for parallel simulation (long ticks, world updates)
- Zod for data validation
- Optional Ink.js for narrative integration (storylets generated from logs/events)

**Persistence & Packaging**
- Dexie.js for IndexedDB saves
- pako + JSZip for compression/export
- versioned Dexie migrations
- Vite PWA for offline play

**Audio/Visual Layer**
- howler.js (sound)
- Framer Motion (animation)
- Lucide React (icons)
- Recharts (analytics)
- react-markdown (dynamic text rendering)

**Tooling**
- Vite / ESBuild
- ESLint + Prettier
- Vitest + React Testing Library
- GitHub Actions (build automation)

---

# 3. Determinism Rules (Deterministic but Divergent)

## 3.1 World Seed
A single **World Seed** deterministically drives:
- world generation (beya count, starting rosters, initial attributes)
- schedule generation rules (where applicable)
- combat RNG (via bout seeds derived from world seed + participants + match identifiers)

## 3.2 Divergence That’s Allowed (Still Deterministic)
The world is deterministic, but outcomes can still vary because inputs vary:
- training choices
- facility upgrades
- scouting decisions (when introduced)
- roster changes (recruitment, transfers, retirements)
- event triggers (seasonal events, scandals, injuries) *when those triggers are themselves deterministic*

## 3.3 Forbidden Non-Determinism
When operating in canonical deterministic mode:
- do **not** call `Date.now()` inside simulation logic
- do **not** use unseeded `Math.random()`
- do **not** run asynchronous UI timing that affects sim results

---

# 4. World Structure

## 4.1 Flexible Beya Count
- Initial world spawns approximately **42 stables**, randomized within **39–45**.
- Long-term world target remains “around 42” but flexible to support:
  - new stable founding by retired rikishi
  - stable closure on failed succession
- Soft world bounds: typically **35–50 active stables**.

## 4.2 Core Entities (High Level)
- **Heya (Stable)**: roster, oyakata, funds, reputation, facilities.
- **Rikishi**: permanent identity + evolving body + evolving performance profile.
- **BashoState**: schedule, results, day progression, standings.
- **WorldState**: seed, time, entity registries, history.

---

# 5. Time, Calendar, and the Six-Basho Loop

## 5.1 Annual Loop
- 6 basho per in-game year.
- Basho index cycles (0–5) across: Hatsu, Haru, Natsu, Nagoya, Aki, Kyushu.

## 5.2 Time Progression Modes
- **During basho**: advance by **day** (Day 1–15).
- **Between basho**: advance by **week** (interim).

## 5.3 Interim Length
- Interim phase is **6 weeks** bridging tournaments.

---

# 6. Beya (Stable) System: Founding, Succession, Closure

## 6.1 Oyakata Eligibility (Rules + Hook)
A candidate must satisfy:
- Rank/standing threshold (design intent: sanyaku-caliber career)
- Age ≥ 28
- Clean conduct (no severe sanctions)
- Access to elder stock line (kabu/toshiyori) when governance is fully modeled

## 6.2 Succession Rules (Explicit)
**Trigger moments**
- end of each basho (review hook)
- oyakata retirement
- oyakata death/disqualification (event-driven)

**Selection pipeline**
1. Identify successor pool
   - internal candidates (stable elders, retired stars)
   - external candidates (available elder stock holders)
2. Score candidates
   - leadership, reputation, prestige
   - loyalty and stable cohesion
   - finances/facilities compatibility
   - conduct and reliability
3. Select successor if any clears threshold
4. If no successor clears threshold → closure or merge (merge is optional/future)

## 6.3 Closure Rules (Full)
A stable closes when any of the following occurs:
- oyakata retires/dies and no qualified successor exists
- forced dissolution due to severe governance sanction (future: match-fixing, violence)
- insolvency after grace period and rescue attempts (future: loans/benefactors)

## 6.4 Founding New Stables (Detailed)
A new stable may be founded when:
- a qualified retired rikishi obtains elder stock
- world cap is not exceeded (soft constraint)
- minimum funds/facilities are met (can be modest)

Founding creates:
- new heya entity with seeded facilities
- reputation baseline
- recruitment slots and a “founding narrative” headline

---

# 7. Rikishi Identity, Growth, Style Evolution, and Career Phases

## 7.1 Permanent Identity
Permanent data (never changes):
- unique `id`
- unique `shikona` (generated from weighted syllables; uniqueness enforced)
- `nationality` and other origin metadata (if used)

## 7.2 Evolving Physique (Current + Potential)
Rikishi **height, weight, and style evolve over time**.
- Each rikishi has **current** and **potential** height/weight.
- Not all rikishi reach potential (fulfillment is deterministic and variable).

See **Career Phase Model** below for how growth plays out.

# 7.7 Career Phase Model (Growth → Prime → Decline)

Stable Lords models a rikishi as a **long-lived, evolving athlete**. The goal is that careers generate believable arcs and narrative beats, while remaining deterministic under a seed.

## A) Career Phases (Conceptual)
> Phase boundaries are not hard-coded ages; they are computed from age + physique fulfillment + injury history + performance trajectory.

### 1) Youth / Prospect
- **Theme:** potential not yet realized.
- **Physique:** height and weight trend toward potential at the highest rate.
- **Skills:** “spiky” improvements; technique and balance can jump with good coaching.
- **Style drift:** most likely here (oshi ↔ hybrid ↔ yotsu can meaningfully shift).

### 2) Development / Rise
- **Theme:** specialization begins.
- **Physique:** weight approaches a chosen “fighting mass”; height growth slows/ends.
- **Skills:** steadier gains; archetype expression becomes clearer.
- **Favorites:** tokui-waza begins to stabilize (top 2–3 emerge).

### 3) Prime
- **Theme:** highest consistency and conversion rate.
- **Physique:** stable; weight may oscillate seasonally with training blocks.
- **Skills:** gains are marginal; consistency and composure dominate.
- **Favorites:** signature move set is established; counters improve with experience.

### 4) Veteran / Decline
- **Theme:** adaptation under constraint.
- **Physique:** weight may increase (or decrease due to injury management); speed often declines first.
- **Skills:** technique/experience remain strong, but physical outputs fall.
- **Style drift:** often toward **yotsu/hybrid** for control or toward **trickster** patterns for survival (depending on attributes).

### 5) Late Career / Exit
- **Theme:** legacy, succession, and story closure.
- **Physique:** managed; injuries accumulate; fatigue sensitivity high.
- **Outcomes:** retirement triggers governance hooks (succession / stable founding).

## B) Current vs Potential Physique (Data Contract)
Each rikishi stores:
- `heightCurrentCm`, `heightPotentialCm`
- `weightCurrentKg`, `weightPotentialKg`
- `growthFulfillment` (0–1): how much of potential is realistically reachable
- `growthRateProfile` (seeded): “early bloomer”, “late bloomer”, “steady”, etc.

**Deterministic rule:** growth changes are deterministic from (seed + age + training + injury). No pure randomness.

## C) Physique → Style + Kimarite Feedback Loop
As physique changes, it should influence:
1. **Style** (oshi/yotsu/hybrid) recalculation
2. **Grip success** probability in clinch phase
3. **Kimarite selection weights**
4. **Favorite moves drift** (tokui-waza)

Example effects:
- +weight +power → increases force-out conversion, pushes `oshidashi/yorikiri` frequency upward
- +balance +technique → increases throws/twists in belt stances
- +speed +agility → increases trips/evasion, raises lateral position events
- accumulated injuries → decrease speed burst, raise “short finish” behaviors (slap/pull, quick pushdowns)

## D) “Not Everyone Reaches Potential” (Fulfillment Rules)
A rikishi may fail to reach potential due to:
- repeated injury interrupts growth/training
- poor facility quality (nutrition/recovery)
- mismatch between training intensity and body type
- chronic fatigue from overtraining
- (optional later) personality traits: discipline, professionalism, risk appetite

This creates believable variance in career arcs without breaking determinism.


## 7.8 Style Evolution (Explicit)
Style is a **current classification**, and can drift across a career:
- `oshi`: distance, pushing/thrusting, linear pressure
- `yotsu`: belt control, throws/twists/lifts, clinch dominance
- `hybrid`: adaptable toolbox, can win from both distance and grip states

**Style update cadence (Option A):**
- recompute at end of each basho (or quarterly in interim)
- apply hysteresis thresholds to prevent sudden flips

**Inputs to recompute style**
- physique deltas (weight/height changes)
- observed kimarite distribution (which finishes actually occur)
- grip success distribution (belt-dominant frequency)
- coaching emphasis (if modeled)
- archetype as a soft bias, not a hard lock

## 7.9 Tokui-waza / Favorite Moves Drift
- `favoredKimarite` reflects the top 2–3 winning finishes.
- It is updated after each win and displayed on the rikishi card.
- As physique/style changes, the favored list should *naturally* drift.


## 7.10 Dynamic State Attributes (Fatigue, Momentum, Injuries)

In addition to “long arc” attributes (physique, skills, style), each rikishi carries **short-term dynamic state** that changes frequently and meaningfully shapes outcomes. These values exist to produce believable arcs (“he was gassed,” “he peaked late,” “his knee betrayed him”) while staying deterministic.

### 7.10.1 Fatigue (0–100)

**Definition:** A scalar representing accumulated physical strain and reduced readiness.

**How fatigue increases**
- **During basho:** each bout adds fatigue based on:
  - bout length (number of momentum ticks)
  - explosive actions (tachiai burst, repeated lateral recoveries)
  - mass vs opponent (heavy collisions cost more)
  - current injury status (injured athletes fatigue faster)
- **Between basho (training):** fatigue increases with training intensity and decreases with recovery emphasis.

**How fatigue recovers**
- **Interim weeks:** baseline recovery each week.
- **Facilities:** better recovery/nutrition facilities increase recovery per week.
- **Training choices:** recovery blocks, deload weeks, or conservative programs accelerate recovery.

**Mechanical effects (canonical)**
- High fatigue reduces:
  - tachiai burst (initiative probability)
  - speed/agility contribution during momentum ticks
  - counter success (especially late-bout recoveries)
- High fatigue increases:
  - injury risk
  - “short finish” likelihood (slap/pull, quick pushdowns) as the engine prefers quicker resolutions when output is low.

**Narrative effects**
- Log phrasing should reflect fatigue at meaningful thresholds (e.g., “legs looked heavy,” “couldn’t reset his base”).

### 7.10.2 Momentum / Form (–10 to +10)

**Definition:** A short-term representation of confidence, rhythm, and execution sharpness.

**How momentum changes**
- Increases from:
  - winning streaks
  - upsets (especially against higher rank)
  - rivalry wins (see §11.3)
  - clutch finishes (late bout recoveries)
- Decreases from:
  - losing streaks
  - repeated one-sided losses
  - injury setbacks
  - scandal / discipline events (when modeled)

**Decay**
- Momentum naturally decays during interim so the world doesn’t become permanently “hot” or “cold.”
- The decay rate is deterministic and may be influenced by discipline traits (future), facilities, and stable culture (future).

**Mechanical effects (canonical)**
- Momentum slightly biases:
  - tachiai advantage
  - conversion rate once a finisher is selected (not the selection itself, which remains registry-driven)
- Momentum can raise volatility in rivalry bouts (see §11.3).

**Narrative effects**
- Momentum drives commentary tone: “in form,” “slumping,” “found his rhythm.”

### 7.10.3 Injury State (Deterministic)

**Definition:** Injuries are stateful conditions that apply attribute penalties and recovery timelines.

**Injury model**
- Each injury tracks:
  - `severity` (light / moderate / severe)
  - `affectedOutputs` (e.g., speed, balance, power, stamina)
  - `recoveryWeeksRemaining`
  - `recurrenceRisk` modifier (higher after prior injuries of the same type)

**How injuries occur**
- Injuries are deterministic outcomes derived from:
  - current fatigue
  - mass and collision intensity
  - training intensity
  - prior injury history
  - bout patterns (long, grinding matches raise risk)
  - seed and state, never unseeded randomness

**Mechanical effects (canonical)**
- Attribute penalties apply immediately.
- Recovery reduces penalties gradually or stepwise per week (implementation choice, but deterministic).
- Injuries increase likelihood of style drift toward control or survival patterns late career (§7.7).

**UI expectations**
- Injury status must be visible, with a clear recovery timeline.
- When attributes are hidden by scouting (§11.4), injuries remain visible as “observable truth.”

---

# 8. Combat Engine V3 (Deterministic): Phase Model, Logs, Counters

## 8.1 Phase Model (Canonical)
1. **Tachiai**  
   - determine initial advantage from (power, speed, balance, aggression, momentum)
   - apply archetype tachiai bonus and matchup bonuses
   - weight advantage (mass) modifies outcomes

2. **Clinch / Grip Battle**  
   - decide stance outcome:
     - `belt-dominant`
     - `push-dominant`
     - `no-grip`
     - `migi-yotsu`
     - `hidari-yotsu`
   - stance selection depends on grip preferences, style, technique/experience deltas

3. **Momentum Ticks**  
   - fatigue accumulates; advantage can shift
   - volatility increases lateral and rear position events
   - counters/recoveries depend on balance + experience + archetype counter bonus

4. **Finisher Window (82 Kimarite)**  
   - filter registry by stance/position/grip rules
   - weight remaining options using matrix + affinities + favorites
   - optionally trigger counter-attack resolution and flip winner

5. **Result & Log**  
   - produce `BoutResult`
   - produce structured narrative log entries for each phase

## 8.2 Narrative Log Contract
Each bout produces log entries shaped like:
- phase: `tachiai | clinch | momentum | finish`
- description: player-readable line
- data: structured numbers/flags for UI and analytics

---

# 9. Banzuke (Ranking) System

## 9.1 Hierarchy
- Makuuchi: Yokozuna, Ozeki, Sekiwake, Komusubi, Maegashira (M1–M17 E/W)
- Juryo (J1–J14 E/W)
- Makushita, Sandanme, Jonidan, Jonokuchi

## 9.2 Bouts per Basho
- Sekitori (Juryo+): 15 bouts
- Lower divisions: 7 bouts

## 9.3 Kachi-koshi / Make-koshi
- kachi-koshi = majority wins (8/15 or 4/7)
- make-koshi = majority losses

## 9.4 Promotion Heuristics (Explicit)
- Ozeki: ~33 wins across 3 basho in sanyaku
- Yokozuna: deliberation, typically consecutive yusho or equivalent
- Makushita → Juryo: usually requires high Makushita rank + strong record

---

# 10. The 82-Kimarite System (Option A)

## 10.1 Canonical Purpose
The 82-kimarite system is the **action space** for fight endings:
- it enforces authenticity and variety
- it enables narrative and scouting (players learn “what this rikishi does”)
- it creates emergent tokui-waza and career identity

## 10.2 The 82 Kimarite List (Option A — IDs and Names)
This is the Option A canonical list used by the sim registry.

- `yorikiri` — **Yorikiri**
- `oshidashi` — **Oshidashi**
- `oshitaoshi` — **Oshitaoshi**
- `yoritaoshi` — **Yoritaoshi**
- `hatakikomi` — **Hatakikomi**
- `hikiotoshi` — **Hikiotoshi**
- `tsukiotoshi` — **Tsukiotoshi**
- `tsukidashi` — **Tsukidashi**
- `katasukashi` — **Katasukashi**
- `kotenage` — **Kotenage**
- `uwatenage` — **Uwatenage**
- `shitatenage` — **Shitatenage**
- `sukuinage` — **Sukuinage**
- `kubinage` — **Kubinage**
- `kakenage` — **Kakenage**
- `shitatedashinage` — **Shitatedashinage**
- `uwatedashinage` — **Uwatedashinage**
- `sotogake` — **Sotogake**
- `uchigake` — **Uchigake**
- `ketaguri` — **Ketaguri**
- `okuridashi` — **Okuridashi**
- `okuritaoshi` — **Okuritaoshi**
- `okurihikiotoshi` — **Okurihikiotoshi**
- `okuritsukiotoshi` — **Okuritsukiotoshi**
- `okurinage` — **Okurinage**
- `tsuridashi` — **Tsuridashi**
- `tsuriotoshi` — **Tsuriotoshi**
- `abisetaoshi` — **Abisetaoshi**
- `sabaori` — **Sabaori**
- `kirikaeshi` — **Kirikaeshi**
- `komatasukui` — **Komatasukui**
- `harimanage` — **Harimanage**
- `haraiotoshi` — **Haraiotoshi**
- `kirinuke` — **Kirinuke**
- `ipponzeoi` — **Ipponzeoi**
- `kimedashi` — **Kimedashi**
- `kimekomi` — **Kimekomi**
- `shitatehineri` — **Shitatehineri**
- `uwatehineri` — **Uwatehineri**
- `susoharai` — **Susoharai**
- `sotokomata` — **Sotokomata**
- `uchimuso` — **Uchimuso**
- `sotomuso` — **Sotomuso**
- `ashitori` — **Ashitori**
- `haritsuke` — **Haritsuke**
- `nodowa` — **Nodowa**
- `tokkurinage` — **Tokkurinage**
- `yaguranage` — **Yaguranage**
- `mitokorozeme` — **Mitokorozeme**
- `tsutaezori` — **Tsutaezori**
- `izori` — **Izori**
- `okuritsuridashi` — **Okuritsuridashi**
- `tsukaminage` — **Tsukaminage**
- `nichonage` — **Nichonage**
- `zuban` — **Zuban**
- `fumikomi` — **Fumikomi**
- `guntingeri` — **Guntingeri**
- `kawazugake` — **Kawazugake**
- `kawazugakenage` — **Kawazugakenage**
- `kawazugakeotoshi` — **Kawazugakeotoshi**
- `okuritsukiotoshi` — **Okuritsukiotoshi**
- `okuritsuriotoshi` — **Okuritsuriotoshi**
- `hansoku` — **Hansoku**
- `hikiwake` — **Hikiwake**
- `fusensho` — **Fusensho**
- `fusenpai` — **Fusenpai**
- `tsukiotoshiotoshi` — **Tsukiotoshiotoshi**
- `harimanageotoshi` — **Harimanageotoshi**
- `shumokuzori` — **Shumokuzori**
- `kakezori` — **Kakezori**
- `susoharaiotoshi` — **Susoharaiotoshi**
- `sotogakeotoshi` — **Sotogakeotoshi**
- `uchigakeotoshi` — **Uchigakeotoshi**
- `uwatenageotoshi` — **Uwatenageotoshi**
- `shitatenageotoshi` — **Shitatenageotoshi**
- `komatasukuiotoshi` — **Komatasukuiotoshi**
- `sukuinageotoshi` — **Sukuinageotoshi**
- `yorikiriotoshi` — **Yorikiriotoshi**
- `oshidashiotoshi` — **Oshidashiotoshi**
- `yoritaoshiotoshi` — **Yoritaoshiotoshi**
- `okuridashiotoshi` — **Okuridashiotoshi**
- `okuritaoshiotoshi` — **Okuritaoshiotoshi**

## 10.3 Archetype → Kimarite Usage Matrix (How the Engine Weights the 82)

This is the **“Option A”** weighting concept. The actual engine computes weights per move from:
- `baseWeight`
- `styleAffinity`
- `archetypeBonus`
- `preferredClasses`
- stance & position multipliers
- favorite-move multiplier
- rarity dampening

To make those decisions transparent and tuneable, we define a **matrix of intent**.

### A) Preferred Kimarite Classes by Archetype (Multipliers)
These multipliers apply *after* baseWeight + affinities, before random selection.

| Archetype | force_out/push/thrust | throw/twist/lift | slap_pull | trip/evasion | rear | special |
|---|---:|---:|---:|---:|---:|---:|
| **Oshi Specialist** | **1.45×** | 0.85× | 1.10× | 0.95× | 1.05× | 0.80× |
| **Yotsu Specialist** | 1.05× | **1.55×** | 0.90× | 0.95× | 1.15× | 1.00× |
| **Speedster** | 1.05× | 0.90× | 1.20× | **1.60×** | 1.10× | 0.95× |
| **Trickster** | 0.85× | 0.95× | **1.65×** | **1.35×** | 1.05× | 1.20× |
| **All‑Rounder** | 1.15× | 1.15× | 1.10× | 1.10× | 1.10× | 1.00× |

**Notes**
- “rear” is mostly unlocked by **position** (rear), so multipliers here are modest.
- “special” is narrative spice: higher for Trickster, dampened for Oshi.
- This matrix is a *design control*; the registry’s per‑move bonuses should align with it.

### B) Stance → Class Bias (Multipliers)
These are global stance multipliers that stack with archetype multipliers.

| Stance | force_out/push/thrust | throw/twist/lift | slap_pull | trip/evasion | rear |
|---|---:|---:|---:|---:|---:|
| **push-dominant** | **1.45×** | 0.85× | 1.20× | 1.10× | 1.00× |
| **belt-dominant** | 0.95× | **1.55×** | 0.90× | 1.00× | 1.10× |
| **migi-yotsu / hidari-yotsu** | 1.00× | **1.45×** | 0.95× | 1.05× | 1.10× |
| **no-grip** | 1.05× | 0.65× | **1.30×** | **1.20×** | 0.80× |

### C) Position → Vector Bias (Multipliers)
| Position | frontal vector | lateral vector | rear vector |
|---|---:|---:|---:|
| **frontal** | **1.15×** | 1.00× | 0.70× |
| **lateral** | 1.00× | **1.20×** | 0.85× |
| **rear** | 0.80× | 0.95× | **2.25×** |

### D) Favorite Moves (Tokui-waza) Multiplier
If the selected move is in the attacker’s `favoredKimarite[]`:
- multiply weight by **2.0×** (Option A default)

This is the main mechanism that causes **signature moves to emerge organically** as careers progress.


---

# 11. Economy: Kenshō, Prestige, Stable Funds, Retirement Funds

## 11.1 Kenshō Payout (Option A)
Per banner:
- ¥10,000 → stable funds (immediate)
- ¥50,000 → rikishi retirement fund
- remaining portion treated as fees/overhead (narratively consistent with banner cost structure)

## 11.2 Prestige
Prestige is a scalar used to:
- influence kenshō attraction
- influence narrative spotlighting (and later rivalry heat)
Prestige decays during interim to prevent runaway snowballing.


## 11.3 Rivalries (Canonical)

Stable Lords models **persistent interpersonal rivalries** to increase story density and to create meaningful “headlines” from repeated meetings—without scripting winners.

### 11.3.1 Rivalry Object
A rivalry is a world entity linking two rikishi:
- `rikishiAId`, `rikishiBId`
- `heat` (0–100)
- `keyMoments[]` (bout IDs, basho IDs, tags like “upset”, “playoff”, “injury”)
- `lastUpdatedTick`

### 11.3.2 Heat Generation
Heat increases deterministically from:
- repeated matchups within a short window
- close bouts (multiple momentum reversals, narrow finishes)
- upsets (lower rank beats higher rank)
- title races (late basho contention, senshuraku stakes)
- playoffs / decisive bouts

Heat decays during interim to prevent permanent inflation.

### 11.3.3 Mechanical Effects
Rivalry heat modifies (subtle, not overpowering):
- tachiai intensity and initiative volatility
- risk appetite (more commitment on finish attempts, more counter windows)
- narrative emphasis (logs become “louder,” headlines more likely)

**Rule:** rivalry effects increase variance but do not override core attribute logic.

### 11.3.4 Narrative Effects
Rivalries feed:
- headline selection priority
- commentary tone (“bad blood,” “unfinished business”)
- scouting interest (see §11.4)

---

## 11.4 Scouting and Fog of War (Canonical)

Stable Lords supports a “fog of war” layer where some information about opponents is uncertain until observed.

### 11.4.1 What Can Be Hidden
By default, some attributes may be hidden or shown as ranges:
- technique nuance (throw timing, grip craft)
- injury resilience / durability tendencies
- composure / mental stability (future trait)
- growth fulfillment ceiling (how close they’ll reach potential)

### 11.4.2 How Information Is Revealed
Scouting reveals truth through deterministic observation:
- watching bouts (public information)
- repeated matchups (rivalry exposure)
- stable reports / coach notes (future)
- deliberate scouting actions (future menu)

### 11.4.3 Output Format
Scouting outputs are expressed as:
- confidence ranges
- “analyst notes” with evidence hooks (e.g., “wins spike in belt-dominant stances”)
- narrative rumors (when enabled), which should never contradict confirmed truth

**Hard rule:** scouting never lies; it only ranges uncertainty until revealed.

---

## 11.5 Seasonal Tone and World Flavor (Canonical)

Each basho has a **seasonal tone** that flavors narrative and applies light systemic bias:
- Winter, Spring, Summer, Autumn

### 11.5.1 Narrative Use
Seasonal tone influences:
- headline language
- crowd mood and “feel”
- travel fatigue framing
- injury story framing (“cold joints,” “summer grind”)

### 11.5.2 Light Mechanical Bias
Season can subtly influence:
- fatigue recovery rates
- injury likelihood modifiers
- travel stress (if modeled)

All seasonal effects must remain deterministic and modest; the primary role is tone.

---

# 12. Narrative Consumption Layer (Formalized)

Stable Lords is **narrative-first**, but the narrative system is explicitly treated as a **consumer** of simulation—not a driver of outcomes.

## 12.1 Principle: Narrative Never Changes Results
- No narrative system may alter:
  - bout winners
  - injuries
  - promotions
  - economy outcomes
- Narrative is derived from the same deterministic state, ensuring replayability and debuggability.

## 12.2 Inputs (Sources of Narrative Truth)
Narrative pulls from:
- bout phase logs (§8.2)
- rivalry objects (§11.3)
- seasonal tone (§11.5)
- prestige deltas (§11.2)
- succession/founding/closure events (§6)
- injuries and comebacks (§7.10)

## 12.3 Outputs (What Narrative Produces)
Narrative outputs include:
- **Headlines**: short “news hits” surfaced at day-end or basho-end
- **Storylets** (future): longer, Ink.js-ready moments derived from tags and thresholds
- **Analyst Commentary**: contextual reading of stats and trends (ties into scouting §11.4)
- **Retrospectives**: rivalry and career milestone recaps

## 12.4 Canonical Headline Selection (Deterministic)
Headline generation is deterministic:
- gather candidate events (upsets, streaks, injuries, rivalry spikes, succession events)
- score candidates by importance (rank stakes, rarity, heat, prestige)
- select top N headlines with diversity constraints (avoid repeats)
- render using season + rivalry tone modifiers

**Rule:** if two playthroughs produce the same event stream, they produce the same headlines.

# 13. Data Contracts (Types) and Helper Modules

## 13.1 Canonical Types
- `types.ts`: Style, Stance, TacticalArchetype, Rikishi, Heya, BashoState, WorldState, etc.
- Ensure data includes:
  - current + potential physique fields
  - career phase / growth fulfillment fields
  - favored kimarite tracking

## 12.2 Canonical Helper Modules
- `banzuke.ts`: rank hierarchy, formatting, kachi-koshi checks, kadoban logic
- `kimarite.ts`: registry + lookup helpers
- `boutEngineV3.ts`: deterministic multi-phase sim + logs

## 12.3 “One Source of Truth” Rules
- The kimarite registry defines the allowed endings and their metadata.
- The bout engine must not hardcode special-case endings except:
  - forfeits (if modeled as special results)
  - safety/guardrails (e.g., missing data fallback)

---

End of Clean Canon v1.1 (Full)

## 13.4 Kimarite Aliases and Post-Processing Labels (Canonical)

The **82-kimarite registry is fixed** as the win space. However, the UI and narrative layer may add **post-processing labels** to increase readability and flavor without bloating the registry.

### 13.4.1 Allowed Post-Processing
- descriptive suffixes (“late”, “edge”, “counter”, “on the straw”)
- alias display names (presentation-only)
- contextual “otoshi-style” labels if the finish is the same official kimarite but executed in a particular way

### 13.4.2 Constraints
- these labels must never be treated as new kimarite IDs
- the bout engine still records the official kimarite as the canonical result
- analytics should aggregate by official kimarite ID, with optional drill-down by label

### 13.4.3 Purpose
- keep authenticity (official 82 remain intact)
- keep tuning stable (avoid multiplying balance knobs)
- preserve narrative richness and commentary specificity

# 14. Forward-Declared Systems (Canonical but Dormant)

This section defines systems that are **canonically real** in the Stable Lords world but may be **mechanically inactive** in early builds. They are declared now so current systems can expose clean hooks, the data model remains future-proof, and later activation does not require retconning history.

## 14.0 Global Rules for Dormant Systems

### 14.0.1 Canon vs Activation
A system may be:
- **Canonically acknowledged**: it exists in-lore, can be referenced in headlines, and can have placeholder UI.
- **Mechanically dormant**: no player-facing controls and no hidden outcome changes.

Dormant systems may generate narrative flavor, but must not create surprise outcomes.

### 14.0.2 Determinism
When activated, each system must obey:
- outcomes derived from **World Seed + world state + explicit player choices**
- no unseeded randomness
- triggers must be reproducible given the same input stream

### 14.0.3 Hook-First Implementation
Even while dormant, each system should have:
- a minimal **data footprint**
- a single **simulation entry point** (“hook” in tick processing)
- a narrative integration point (headline tags)
- a guarded UI placeholder that explains “not active yet” (Always Playable)

### 14.0.4 No-Retcon Contract
Activation must not invalidate previously generated history. Where needed, interpret earlier worlds as having operated under “implicit/simple” versions of governance and finance.

---

## 14.1 Governance V1 (Kabu Availability, Council Politics)

Governance models the institutions that constrain stable ownership, succession, and legitimacy.

### 14.1.1 Core Concept
In early versions, oyakata eligibility exists as a clear rule hook (§6.1). Governance V1 formalizes the “institutional layer”:
- **kabu (elder stock)** constraints (finite resource)
- a governing body that arbitrates edge cases
- reputational / political dynamics affecting approvals and sanctions

Governance V1 is not grand strategy; it is a constraint + narrative generator with limited levers.

### 14.1.2 Kabu Pool
The world contains a finite pool of kabu units.
Each kabu can be:
- held by an eligible retired rikishi
- vacant/unassigned
- tied to a prestige tier for narrative color

**Effects**
- **Succession:** best candidate may still fail without kabu access.
- **Founding:** new stable creation requires kabu and governance approval.

### 14.1.3 Council Layer (Light Politics)
A council exists to:
- approve/deny succession outcomes
- investigate scandals
- issue sanctions (warnings → suspensions → forced dissolution in severe cases)

### 14.1.4 Decision Inputs
Governance decisions consider:
- candidate prestige and legacy
- stable reputation
- conduct flags (violence, match-fixing suspicion)
- financial solvency risk

### 14.1.5 Example: Succession with Governance
1. Oyakata retires.
2. Candidate pool built (internal + external).
3. Candidates scored (leadership, loyalty, finances, conduct).
4. Governance checks kabu access and legitimacy.
5. Outcome:
   - approved successor
   - interim caretaker (optional)
   - denial → closure or merger pathway

### 14.1.6 Data Footprint (Minimal)
Suggested entities:
- `KabuStock { id, prestigeTier, currentHolderRikishiId?, status }`
- `GovernanceCase { id, type, involvedIds, severity, resolution, createdAtTick }`
- `GovernanceProfile { heyaId, legitimacyScore, conductScore, politicalCapital }`

### 14.1.7 Dormant Mode Behavior
- kabu treated as implicitly available for qualified candidates
- council does not block actions; it may only generate narrative headlines

---

## 14.2 Stable Mergers (Optional Alternative to Closure)

Mergers are a safety valve and a narrative machine: when succession fails, a stable may be absorbed rather than disappear.

### 14.2.1 Trigger Conditions
Mergers are considered when:
- no successor clears threshold at retirement/death
- the stable still has value (facilities, roster, legacy)
- another stable is willing and able to absorb

### 14.2.2 Selecting Merger Partners
Candidate recipient stables are scored by:
- roster capacity
- reputation tier proximity (optional)
- culture compatibility (oshi/yotsu emphasis can matter narratively)
- finances and stability
- rivalry entanglements (mergers can intensify story)

### 14.2.3 Merger Outcomes
- **Full absorption:** closing stable ceases; roster transfers; facilities convert to value or upgrades.
- **Lineage preservation (optional):** stable name survives as a “branch identity” for narrative.
- **Split absorption (rare):** roster split across multiple stables (high complexity; use sparingly).

### 14.2.4 Effects on Rikishi
- morale/loyalty impacts (short-term momentum changes)
- training environment changes (facility access and coaching emphasis)
- rivalry reshaping (forced cohabitation and new frictions)

### 14.2.5 Dormant Mode Behavior
- default remains closure (§6.3)
- mergers may appear as narrative-only “rumors” with no mechanical effect

---

## 14.3 Loans and Benefactors (Insolvency Rescue)

This system expands the economy into long arcs: survival stories, obligations, and pressure.

### 14.3.1 Core Concept
A stable can enter distress due to:
- poor performance (low prestige → fewer banners)
- overspending on facilities
- injury clusters reducing results
- investment choices that fail to pay off

Loans/benefactors provide survival options with consequences.

### 14.3.2 Trigger Conditions
A stable is at risk when:
- funds drop below a solvency threshold
- obligations exceed projected income
- deterministic events damage income (when modeled)

### 14.3.3 Rescue Options
- **Traditional loan:** principal + interest + repayment schedule; failure escalates consequences.
- **Benefactor/patron:** funding with “strings” (recruitment demands, reputation shifts, influence).
- **Asset liquidation:** downgrade/sell facilities for cash (survival at long-term cost).

### 14.3.4 Deterministic Repayment
No random bankruptcy:
- repayment schedules deterministic
- income projections computed from prestige, roster tier, and banners
- failure is a predictable consequence of choices and performance

### 14.3.5 Dormant Mode Behavior
- insolvency handled via simple grace period and narrative warnings
- no instruments unless activated

---

## 14.4 Career Journals and Analytics Views

This system makes the sim legible and lovable by turning history into readable arcs.

### 14.4.1 Career Journal (Per Rikishi)
The journal is a chronological record derived from logs and events:
- debut and stable entry
- basho-by-basho results
- rank changes with contextual notes
- signature bouts (upsets, rivalry spikes, yusho races)
- injuries and comebacks
- style drift and favored kimarite evolution
- retirement and legacy outcomes

**Rule:** journals are generated deterministically; no manual writing required.

### 14.4.2 Analytics Views (Player and World)
Analytics are “truth tools”:
- win rate by stance type
- kimarite class distribution
- favored moves over time
- physique progression (current vs potential)
- injury and fatigue patterns
- stable dashboards: prestige trend, finances trend, roster pipeline

### 14.4.3 Dormant Mode Behavior
- store enough history to reconstruct later
- UI may show a minimal “History” summary (recent basho + top kimarite)

---

## 14.5 Activation Order Principle
To minimize retcons:
1) Career Journals & Analytics (consumes logs; low systemic risk)
2) Loans/Benefactors (extends economy)
3) Stable Mergers (extends closure handling)
4) Governance V1 (ties everything together; highest systemic impact)


End of Clean Canon v1.2 (Full)

```



## SOURCE — Stable_Lords_Master_Context_Clean_Canon_v1.1_FULL.md

```md
# Stable Lords / SumoGame — Master Context (Clean Canon v1.1 — Full)

Date: 2026-01-06  
Purpose: A **sprint-free**, restart-ready, fully explicit design bible describing the entire game, its systems, and the canonical tech/design contracts.

> This document is intended to be copy/pasted into a fresh chat as the full game context, and also used as the canonical reference for implementation.

---

## Table of Contents
1. Core Vision & Pillars  
2. Canonical Tech Stack (Stable Lords Spec v1.0)  
3. Determinism Rules (Deterministic but Divergent)  
4. World Structure (including flexible beya count)  
5. Time, Calendar, and the Six-Basho Loop  
6. Beya (Stable) System: Founding, Succession, Closure  
7. Rikishi Identity, Growth, Style Evolution, and Career Phases  
8. Combat Engine V3 (Deterministic): Phase Model, Logs, Counters  
9. Banzuke (Ranking) System: Hierarchy and Promotion Heuristics  
10. The 82-Kimarite System (Option A): Registry + Weighting Matrix  
11. Economy: Kenshō, Prestige, Stable Funds, Retirement Funds  
12. Data Contracts (Types) and Helper Modules  

---

# 1. Core Vision & Pillars (Canonical)

## Pillar 1 — Authenticity
Stable Lords is a **sumo management simulation** grounded in authentic structures:
- **Six basho per year**: Hatsu, Haru, Natsu, Nagoya, Aki, Kyushu.
- **Authentic rank hierarchy**: Yokozuna → Jonokuchi, with correct bout counts per division.
- **Kenshō banners**, payouts, and retirement funds as a core economic loop.
- **Beya-centered world** (stable culture, succession, reputation, facilities).

## Pillar 2 — Deterministic Simulation
- Every outcome is repeatable given the same **World Seed** and the same sequence of player choices.
- Combat is deterministic under seeded RNG (seedrandom), with **data-driven endings** from the 82-kimarite registry.

## Pillar 3 — Narrative-First
- Every bout generates a structured log of phases and pivotal moments.
- Systems (rivalries, seasonal tone, scandals, succession) are explicitly designed to produce “headlines” and story hooks.
- The sim should feel like it creates drama *without* scripting outcomes.

## Pillar 4 — Always Playable
- The build must boot locally and remain navigable at all times.
- Missing features must be guarded and degrade gracefully:
  - seeded demo data
  - stubbed services
  - safe UI states, empty-state copy, and error boundaries
  - offline-friendly packaging patterns

---

# 2. Canonical Tech Stack (Stable Lords Tech Spec v1.0)

**Frontend Core**
- React (Vite) + TypeScript
- Zustand + Immer (state)
- Tailwind + Radix UI (layout/controls/dialogs)
- React Router (navigation)
- React Hook Form (configuration flows)

**Simulation Systems**
- Custom TypeScript sim engine
- seedrandom for deterministic outcomes
- Comlink + Web Workers for parallel simulation (long ticks, world updates)
- Zod for data validation
- Optional Ink.js for narrative integration (storylets generated from logs/events)

**Persistence & Packaging**
- Dexie.js for IndexedDB saves
- pako + JSZip for compression/export
- versioned Dexie migrations
- Vite PWA for offline play

**Audio/Visual Layer**
- howler.js (sound)
- Framer Motion (animation)
- Lucide React (icons)
- Recharts (analytics)
- react-markdown (dynamic text rendering)

**Tooling**
- Vite / ESBuild
- ESLint + Prettier
- Vitest + React Testing Library
- GitHub Actions (build automation)

---

# 3. Determinism Rules (Deterministic but Divergent)

## 3.1 World Seed
A single **World Seed** deterministically drives:
- world generation (beya count, starting rosters, initial attributes)
- schedule generation rules (where applicable)
- combat RNG (via bout seeds derived from world seed + participants + match identifiers)

## 3.2 Divergence That’s Allowed (Still Deterministic)
The world is deterministic, but outcomes can still vary because inputs vary:
- training choices
- facility upgrades
- scouting decisions (when introduced)
- roster changes (recruitment, transfers, retirements)
- event triggers (seasonal events, scandals, injuries) *when those triggers are themselves deterministic*

## 3.3 Forbidden Non-Determinism
When operating in canonical deterministic mode:
- do **not** call `Date.now()` inside simulation logic
- do **not** use unseeded `Math.random()`
- do **not** run asynchronous UI timing that affects sim results

---

# 4. World Structure

## 4.1 Flexible Beya Count
- Initial world spawns approximately **42 stables**, randomized within **39–45**.
- Long-term world target remains “around 42” but flexible to support:
  - new stable founding by retired rikishi
  - stable closure on failed succession
- Soft world bounds: typically **35–50 active stables**.

## 4.2 Core Entities (High Level)
- **Heya (Stable)**: roster, oyakata, funds, reputation, facilities.
- **Rikishi**: permanent identity + evolving body + evolving performance profile.
- **BashoState**: schedule, results, day progression, standings.
- **WorldState**: seed, time, entity registries, history.

---

# 5. Time, Calendar, and the Six-Basho Loop

## 5.1 Annual Loop
- 6 basho per in-game year.
- Basho index cycles (0–5) across: Hatsu, Haru, Natsu, Nagoya, Aki, Kyushu.

## 5.2 Time Progression Modes
- **During basho**: advance by **day** (Day 1–15).
- **Between basho**: advance by **week** (interim).

## 5.3 Interim Length
- Interim phase is **6 weeks** bridging tournaments.

---

# 6. Beya (Stable) System: Founding, Succession, Closure

## 6.1 Oyakata Eligibility (Rules + Hook)
A candidate must satisfy:
- Rank/standing threshold (design intent: sanyaku-caliber career)
- Age ≥ 28
- Clean conduct (no severe sanctions)
- Access to elder stock line (kabu/toshiyori) when governance is fully modeled

## 6.2 Succession Rules (Explicit)
**Trigger moments**
- end of each basho (review hook)
- oyakata retirement
- oyakata death/disqualification (event-driven)

**Selection pipeline**
1. Identify successor pool
   - internal candidates (stable elders, retired stars)
   - external candidates (available elder stock holders)
2. Score candidates
   - leadership, reputation, prestige
   - loyalty and stable cohesion
   - finances/facilities compatibility
   - conduct and reliability
3. Select successor if any clears threshold
4. If no successor clears threshold → closure or merge (merge is optional/future)

## 6.3 Closure Rules (Full)
A stable closes when any of the following occurs:
- oyakata retires/dies and no qualified successor exists
- forced dissolution due to severe governance sanction (future: match-fixing, violence)
- insolvency after grace period and rescue attempts (future: loans/benefactors)

## 6.4 Founding New Stables (Detailed)
A new stable may be founded when:
- a qualified retired rikishi obtains elder stock
- world cap is not exceeded (soft constraint)
- minimum funds/facilities are met (can be modest)

Founding creates:
- new heya entity with seeded facilities
- reputation baseline
- recruitment slots and a “founding narrative” headline

---

# 7. Rikishi Identity, Growth, Style Evolution, and Career Phases

## 7.1 Permanent Identity
Permanent data (never changes):
- unique `id`
- unique `shikona` (generated from weighted syllables; uniqueness enforced)
- `nationality` and other origin metadata (if used)

## 7.2 Evolving Physique (Current + Potential)
Rikishi **height, weight, and style evolve over time**.
- Each rikishi has **current** and **potential** height/weight.
- Not all rikishi reach potential (fulfillment is deterministic and variable).

See **Career Phase Model** below for how growth plays out.

# 7.7 Career Phase Model (Growth → Prime → Decline)

Stable Lords models a rikishi as a **long-lived, evolving athlete**. The goal is that careers generate believable arcs and narrative beats, while remaining deterministic under a seed.

## A) Career Phases (Conceptual)
> Phase boundaries are not hard-coded ages; they are computed from age + physique fulfillment + injury history + performance trajectory.

### 1) Youth / Prospect
- **Theme:** potential not yet realized.
- **Physique:** height and weight trend toward potential at the highest rate.
- **Skills:** “spiky” improvements; technique and balance can jump with good coaching.
- **Style drift:** most likely here (oshi ↔ hybrid ↔ yotsu can meaningfully shift).

### 2) Development / Rise
- **Theme:** specialization begins.
- **Physique:** weight approaches a chosen “fighting mass”; height growth slows/ends.
- **Skills:** steadier gains; archetype expression becomes clearer.
- **Favorites:** tokui-waza begins to stabilize (top 2–3 emerge).

### 3) Prime
- **Theme:** highest consistency and conversion rate.
- **Physique:** stable; weight may oscillate seasonally with training blocks.
- **Skills:** gains are marginal; consistency and composure dominate.
- **Favorites:** signature move set is established; counters improve with experience.

### 4) Veteran / Decline
- **Theme:** adaptation under constraint.
- **Physique:** weight may increase (or decrease due to injury management); speed often declines first.
- **Skills:** technique/experience remain strong, but physical outputs fall.
- **Style drift:** often toward **yotsu/hybrid** for control or toward **trickster** patterns for survival (depending on attributes).

### 5) Late Career / Exit
- **Theme:** legacy, succession, and story closure.
- **Physique:** managed; injuries accumulate; fatigue sensitivity high.
- **Outcomes:** retirement triggers governance hooks (succession / stable founding).

## B) Current vs Potential Physique (Data Contract)
Each rikishi stores:
- `heightCurrentCm`, `heightPotentialCm`
- `weightCurrentKg`, `weightPotentialKg`
- `growthFulfillment` (0–1): how much of potential is realistically reachable
- `growthRateProfile` (seeded): “early bloomer”, “late bloomer”, “steady”, etc.

**Deterministic rule:** growth changes are deterministic from (seed + age + training + injury). No pure randomness.

## C) Physique → Style + Kimarite Feedback Loop
As physique changes, it should influence:
1. **Style** (oshi/yotsu/hybrid) recalculation
2. **Grip success** probability in clinch phase
3. **Kimarite selection weights**
4. **Favorite moves drift** (tokui-waza)

Example effects:
- +weight +power → increases force-out conversion, pushes `oshidashi/yorikiri` frequency upward
- +balance +technique → increases throws/twists in belt stances
- +speed +agility → increases trips/evasion, raises lateral position events
- accumulated injuries → decrease speed burst, raise “short finish” behaviors (slap/pull, quick pushdowns)

## D) “Not Everyone Reaches Potential” (Fulfillment Rules)
A rikishi may fail to reach potential due to:
- repeated injury interrupts growth/training
- poor facility quality (nutrition/recovery)
- mismatch between training intensity and body type
- chronic fatigue from overtraining
- (optional later) personality traits: discipline, professionalism, risk appetite

This creates believable variance in career arcs without breaking determinism.


## 7.8 Style Evolution (Explicit)
Style is a **current classification**, and can drift across a career:
- `oshi`: distance, pushing/thrusting, linear pressure
- `yotsu`: belt control, throws/twists/lifts, clinch dominance
- `hybrid`: adaptable toolbox, can win from both distance and grip states

**Style update cadence (Option A):**
- recompute at end of each basho (or quarterly in interim)
- apply hysteresis thresholds to prevent sudden flips

**Inputs to recompute style**
- physique deltas (weight/height changes)
- observed kimarite distribution (which finishes actually occur)
- grip success distribution (belt-dominant frequency)
- coaching emphasis (if modeled)
- archetype as a soft bias, not a hard lock

## 7.9 Tokui-waza / Favorite Moves Drift
- `favoredKimarite` reflects the top 2–3 winning finishes.
- It is updated after each win and displayed on the rikishi card.
- As physique/style changes, the favored list should *naturally* drift.

---

# 8. Combat Engine V3 (Deterministic): Phase Model, Logs, Counters

## 8.1 Phase Model (Canonical)
1. **Tachiai**  
   - determine initial advantage from (power, speed, balance, aggression, momentum)
   - apply archetype tachiai bonus and matchup bonuses
   - weight advantage (mass) modifies outcomes

2. **Clinch / Grip Battle**  
   - decide stance outcome:
     - `belt-dominant`
     - `push-dominant`
     - `no-grip`
     - `migi-yotsu`
     - `hidari-yotsu`
   - stance selection depends on grip preferences, style, technique/experience deltas

3. **Momentum Ticks**  
   - fatigue accumulates; advantage can shift
   - volatility increases lateral and rear position events
   - counters/recoveries depend on balance + experience + archetype counter bonus

4. **Finisher Window (82 Kimarite)**  
   - filter registry by stance/position/grip rules
   - weight remaining options using matrix + affinities + favorites
   - optionally trigger counter-attack resolution and flip winner

5. **Result & Log**  
   - produce `BoutResult`
   - produce structured narrative log entries for each phase

## 8.2 Narrative Log Contract
Each bout produces log entries shaped like:
- phase: `tachiai | clinch | momentum | finish`
- description: player-readable line
- data: structured numbers/flags for UI and analytics

---

# 9. Banzuke (Ranking) System

## 9.1 Hierarchy
- Makuuchi: Yokozuna, Ozeki, Sekiwake, Komusubi, Maegashira (M1–M17 E/W)
- Juryo (J1–J14 E/W)
- Makushita, Sandanme, Jonidan, Jonokuchi

## 9.2 Bouts per Basho
- Sekitori (Juryo+): 15 bouts
- Lower divisions: 7 bouts

## 9.3 Kachi-koshi / Make-koshi
- kachi-koshi = majority wins (8/15 or 4/7)
- make-koshi = majority losses

## 9.4 Promotion Heuristics (Explicit)
- Ozeki: ~33 wins across 3 basho in sanyaku
- Yokozuna: deliberation, typically consecutive yusho or equivalent
- Makushita → Juryo: usually requires high Makushita rank + strong record

---

# 10. The 82-Kimarite System (Option A)

## 10.1 Canonical Purpose
The 82-kimarite system is the **action space** for fight endings:
- it enforces authenticity and variety
- it enables narrative and scouting (players learn “what this rikishi does”)
- it creates emergent tokui-waza and career identity

## 10.2 The 82 Kimarite List (Option A — IDs and Names)
This is the Option A canonical list used by the sim registry.

- `yorikiri` — **Yorikiri**
- `oshidashi` — **Oshidashi**
- `oshitaoshi` — **Oshitaoshi**
- `yoritaoshi` — **Yoritaoshi**
- `hatakikomi` — **Hatakikomi**
- `hikiotoshi` — **Hikiotoshi**
- `tsukiotoshi` — **Tsukiotoshi**
- `tsukidashi` — **Tsukidashi**
- `katasukashi` — **Katasukashi**
- `kotenage` — **Kotenage**
- `uwatenage` — **Uwatenage**
- `shitatenage` — **Shitatenage**
- `sukuinage` — **Sukuinage**
- `kubinage` — **Kubinage**
- `kakenage` — **Kakenage**
- `shitatedashinage` — **Shitatedashinage**
- `uwatedashinage` — **Uwatedashinage**
- `sotogake` — **Sotogake**
- `uchigake` — **Uchigake**
- `ketaguri` — **Ketaguri**
- `okuridashi` — **Okuridashi**
- `okuritaoshi` — **Okuritaoshi**
- `okurihikiotoshi` — **Okurihikiotoshi**
- `okuritsukiotoshi` — **Okuritsukiotoshi**
- `okurinage` — **Okurinage**
- `tsuridashi` — **Tsuridashi**
- `tsuriotoshi` — **Tsuriotoshi**
- `abisetaoshi` — **Abisetaoshi**
- `sabaori` — **Sabaori**
- `kirikaeshi` — **Kirikaeshi**
- `komatasukui` — **Komatasukui**
- `harimanage` — **Harimanage**
- `haraiotoshi` — **Haraiotoshi**
- `kirinuke` — **Kirinuke**
- `ipponzeoi` — **Ipponzeoi**
- `kimedashi` — **Kimedashi**
- `kimekomi` — **Kimekomi**
- `shitatehineri` — **Shitatehineri**
- `uwatehineri` — **Uwatehineri**
- `susoharai` — **Susoharai**
- `sotokomata` — **Sotokomata**
- `uchimuso` — **Uchimuso**
- `sotomuso` — **Sotomuso**
- `ashitori` — **Ashitori**
- `haritsuke` — **Haritsuke**
- `nodowa` — **Nodowa**
- `tokkurinage` — **Tokkurinage**
- `yaguranage` — **Yaguranage**
- `mitokorozeme` — **Mitokorozeme**
- `tsutaezori` — **Tsutaezori**
- `izori` — **Izori**
- `okuritsuridashi` — **Okuritsuridashi**
- `tsukaminage` — **Tsukaminage**
- `nichonage` — **Nichonage**
- `zuban` — **Zuban**
- `fumikomi` — **Fumikomi**
- `guntingeri` — **Guntingeri**
- `kawazugake` — **Kawazugake**
- `kawazugakenage` — **Kawazugakenage**
- `kawazugakeotoshi` — **Kawazugakeotoshi**
- `okuritsukiotoshi` — **Okuritsukiotoshi**
- `okuritsuriotoshi` — **Okuritsuriotoshi**
- `hansoku` — **Hansoku**
- `hikiwake` — **Hikiwake**
- `fusensho` — **Fusensho**
- `fusenpai` — **Fusenpai**
- `tsukiotoshiotoshi` — **Tsukiotoshiotoshi**
- `harimanageotoshi` — **Harimanageotoshi**
- `shumokuzori` — **Shumokuzori**
- `kakezori` — **Kakezori**
- `susoharaiotoshi` — **Susoharaiotoshi**
- `sotogakeotoshi` — **Sotogakeotoshi**
- `uchigakeotoshi` — **Uchigakeotoshi**
- `uwatenageotoshi` — **Uwatenageotoshi**
- `shitatenageotoshi` — **Shitatenageotoshi**
- `komatasukuiotoshi` — **Komatasukuiotoshi**
- `sukuinageotoshi` — **Sukuinageotoshi**
- `yorikiriotoshi` — **Yorikiriotoshi**
- `oshidashiotoshi` — **Oshidashiotoshi**
- `yoritaoshiotoshi` — **Yoritaoshiotoshi**
- `okuridashiotoshi` — **Okuridashiotoshi**
- `okuritaoshiotoshi` — **Okuritaoshiotoshi**

## 10.3 Archetype → Kimarite Usage Matrix (How the Engine Weights the 82)

This is the **“Option A”** weighting concept. The actual engine computes weights per move from:
- `baseWeight`
- `styleAffinity`
- `archetypeBonus`
- `preferredClasses`
- stance & position multipliers
- favorite-move multiplier
- rarity dampening

To make those decisions transparent and tuneable, we define a **matrix of intent**.

### A) Preferred Kimarite Classes by Archetype (Multipliers)
These multipliers apply *after* baseWeight + affinities, before random selection.

| Archetype | force_out/push/thrust | throw/twist/lift | slap_pull | trip/evasion | rear | special |
|---|---:|---:|---:|---:|---:|---:|
| **Oshi Specialist** | **1.45×** | 0.85× | 1.10× | 0.95× | 1.05× | 0.80× |
| **Yotsu Specialist** | 1.05× | **1.55×** | 0.90× | 0.95× | 1.15× | 1.00× |
| **Speedster** | 1.05× | 0.90× | 1.20× | **1.60×** | 1.10× | 0.95× |
| **Trickster** | 0.85× | 0.95× | **1.65×** | **1.35×** | 1.05× | 1.20× |
| **All‑Rounder** | 1.15× | 1.15× | 1.10× | 1.10× | 1.10× | 1.00× |

**Notes**
- “rear” is mostly unlocked by **position** (rear), so multipliers here are modest.
- “special” is narrative spice: higher for Trickster, dampened for Oshi.
- This matrix is a *design control*; the registry’s per‑move bonuses should align with it.

### B) Stance → Class Bias (Multipliers)
These are global stance multipliers that stack with archetype multipliers.

| Stance | force_out/push/thrust | throw/twist/lift | slap_pull | trip/evasion | rear |
|---|---:|---:|---:|---:|---:|
| **push-dominant** | **1.45×** | 0.85× | 1.20× | 1.10× | 1.00× |
| **belt-dominant** | 0.95× | **1.55×** | 0.90× | 1.00× | 1.10× |
| **migi-yotsu / hidari-yotsu** | 1.00× | **1.45×** | 0.95× | 1.05× | 1.10× |
| **no-grip** | 1.05× | 0.65× | **1.30×** | **1.20×** | 0.80× |

### C) Position → Vector Bias (Multipliers)
| Position | frontal vector | lateral vector | rear vector |
|---|---:|---:|---:|
| **frontal** | **1.15×** | 1.00× | 0.70× |
| **lateral** | 1.00× | **1.20×** | 0.85× |
| **rear** | 0.80× | 0.95× | **2.25×** |

### D) Favorite Moves (Tokui-waza) Multiplier
If the selected move is in the attacker’s `favoredKimarite[]`:
- multiply weight by **2.0×** (Option A default)

This is the main mechanism that causes **signature moves to emerge organically** as careers progress.


---

# 11. Economy: Kenshō, Prestige, Stable Funds, Retirement Funds

## 11.1 Kenshō Payout (Option A)
Per banner:
- ¥10,000 → stable funds (immediate)
- ¥50,000 → rikishi retirement fund
- remaining portion treated as fees/overhead (narratively consistent with banner cost structure)

## 11.2 Prestige
Prestige is a scalar used to:
- influence kenshō attraction
- influence narrative spotlighting (and later rivalry heat)
Prestige decays during interim to prevent runaway snowballing.

---

# 12. Data Contracts (Types) and Helper Modules

## 12.1 Canonical Types
- `types.ts`: Style, Stance, TacticalArchetype, Rikishi, Heya, BashoState, WorldState, etc.
- Ensure data includes:
  - current + potential physique fields
  - career phase / growth fulfillment fields
  - favored kimarite tracking

## 12.2 Canonical Helper Modules
- `banzuke.ts`: rank hierarchy, formatting, kachi-koshi checks, kadoban logic
- `kimarite.ts`: registry + lookup helpers
- `boutEngineV3.ts`: deterministic multi-phase sim + logs

## 12.3 “One Source of Truth” Rules
- The kimarite registry defines the allowed endings and their metadata.
- The bout engine must not hardcode special-case endings except:
  - forfeits (if modeled as special results)
  - safety/guardrails (e.g., missing data fallback)

---

End of Clean Canon v1.1 (Full)

```



## SOURCE — StableLords_Consolidated_MasterContext_v0.4.1.md

```md
# Stable Lords / SumoGame — Consolidated Master Context (v0.4.1)
Date: 2026-01-06  
Baseline: v0.4.0 synchronized (Persistence, Time, Combat Engine V3, Training Core) + identity growth update  
Status: Ready for Sprint F: Rivalries & Scouting V1.1

> **Intent:** This is the single “paste-into-a-new-chat” context file that describes **what the game is**, **how it simulates**, and **what’s next**.  
> It consolidates prior master context + design bible fragments into one canonical spec.

---

## Table of Contents
1. Core Vision & Pillars  
2. Canonical Tech Stack (Stable Lords Spec v1.0)  
3. Determinism Rules (Deterministic but Divergent)  
4. World Structure  
5. Time, Calendar, Basho Loop  
6. Beya (Stable) System: Counts, Founding, Succession, Closure  
7. Rikishi: Identity, Growth, Style Evolution, Traits  
8. Combat Engine V3: Phase Model + Kimarite Integration  
9. Banzuke (Ranking) System: Hierarchy + Promotion/Demotion  
10. Economy: Kenshō, Prestige, Funds  
11. Rivalries, Seasons, World Events (Sprint F/H targets)  
12. Roadmap (Recalibrated)  
13. Data & Code Contracts (Types + Helper Modules)

---

# 1. Core Vision & Pillars (Canonical)

## Pillar 1 — Authenticity
- Full six-basho annual cycle: **Hatsu, Haru, Natsu, Nagoya, Aki, Kyushu**.
- Real banzuke hierarchy (Yokozuna → Jonokuchi) and realistic match counts.
- Kenshō banners with authentic payout split and retirement funds.

## Pillar 2 — Deterministic Simulation
- Every outcome is repeatable when given the same **World Seed** and event inputs.
- The combat engine is data-driven via the **82 Kimarite registry**.

## Pillar 3 — Narrative-First
- Every bout produces a log suitable for storylets (Ink.js-ready later).
- Systems (rivalries, seasonal tone, scandals, succession) are designed to generate “headlines”.

## Pillar 4 — Always Playable
- Builds must boot locally, be navigable, and save/load reliably.
- Missing features must degrade gracefully (stubbed UI/actions, seeded demo data).

---

# 2. Canonical Tech Stack (Stable Lords Spec v1.0)

**Frontend Core**
- React (Vite), TypeScript
- Zustand + Immer (state)
- Tailwind + Radix UI (layout, dialogs, controls)
- React Router (navigation)
- React Hook Form (configuration flows)

**Simulation Systems**
- Custom TypeScript sim engine
- seedrandom for deterministic outcomes
- Comlink + Web Workers for parallel simulation
- Zod for data validation
- Optional Ink.js for narrative integration

**Persistence & Packaging**
- Dexie.js (IndexedDB saves)
- pako + JSZip (compression/export)
- Versioned migrations (Dexie)
- Vite PWA for offline play

**Audio/Visual Layer**
- howler.js (sound)
- Framer Motion (animation)
- Lucide React (icons)
- Recharts (analytics)
- react-markdown (dynamic text)

**Tooling**
- Vite, ESBuild
- ESLint + Prettier
- Vitest + RTL
- GitHub Actions (builds)

---

# 3. Determinism Rules (Deterministic but Divergent)

**World Seed** drives:
- Initial world generation (beya count, heya distribution, initial rikishi pools)
- Tournament schedules and matchup ordering (when applicable)
- Combat RNG (when seeded per bout)

**Allowed divergence (still deterministic):**
- Different *inputs* (training choices, scouting actions, event triggers) change outcomes.
- Narrative branches are deterministic given the same event stream.

**Hard rule:** no hidden calls to `Date.now()` inside simulation logic once “seeded mode” is active.  
(Using timestamps is acceptable only for debug seeds or “quick sim” outside canonical runs.)

---

# 4. World Structure

## 4.1 Flexible Beya Count
- Initial world spawns **~42 stables**, randomized in the range **39–45**.
- Ongoing world constraint: maintain roughly **35–50** active stables over time.
- This flexibility allows:
  - Retiring rikishi to found/take over a stable.
  - Stables to close when succession fails.

## 4.2 World Entities (High level)
- **Heya (stable)**: roster, oyakata, funds, facilities, reputation.
- **Rikishi**: identity, physical attributes (current + potential), skills, career record, economics.
- **BashoState**: tournament schedule, day progression, standings, results, prizes.
- **WorldState**: seed, time, collections, history.

---

# 5. Time, Calendar, Basho Loop

- 6 basho per in-game year (Index 0–5).
- During **Basho**: time advances by **day** (Day 1–15).
- Between basho (**Interim**): advances by **week**.
- Interim length: **6 weeks** bridging tournaments.
- Simulation time is independent of real time; “shipping/build time” is real time only.

---

# 6. Beya System: Founding, Succession, Closure

## 6.1 Oyakata Eligibility (Hook exists)
A candidate must satisfy:
- **Rank:** at least Sanyaku caliber in career history (design intent), and meets implemented check hook.
- **Age:** ≥ 28  
- **Conduct:** clean (no match-fixing / severe conduct flags)
- **Lineage constraint:** must have access to an elder stock line (kabu/toshiyori) in Governance V1.

## 6.2 Succession Rules (Design + hooks)
Trigger: post-basho review (and on retirement/death events).
1. Build candidate list (internal + external).
2. Score candidates:
   - prestige, recent performance, loyalty, leadership, conduct, finances
3. Select successor if any candidate clears threshold.
4. If no candidate clears threshold → stable closes OR merges (future option).

## 6.3 Closure Rules (Full)
A beya closes if **any** of these hold:
- Oyakata retires/dies **and** there is **no qualified successor**.
- Severe governance sanction (future: scandal, match-fixing, violence) forces dissolution.
- Bankruptcy / insolvency (future), after a grace period and rescue attempts.

## 6.4 Founding New Stables (More Detailed)
A new stable may be founded when:
- A qualified retired rikishi acquires elder stock.
- Governance permits stable creation (world cap not exceeded).
- Initial funding and facilities minimum met (can be modest).
Founding creates:
- new heya entity
- starter facility levels
- recruitment slots + reputation baseline

---

# 7. Rikishi: Identity, Growth, Style Evolution, Traits

## 7.1 Permanent Identity (Revised)
**Permanent:**
- Unique `id` (never changes).
- Unique `shikona` (weighted syllable generation; uniqueness enforced).
- Birth metadata (nationality, origin, etc.) as desired.

**Not permanent (updated design):**
- **Height and weight can evolve** over a career (especially early years).
- **Style can evolve** as a consequence of physical development and skill drift.

## 7.2 Current vs Potential Physique (New Canon)
Every rikishi has:
- `heightCurrentCm`, `weightCurrentKg`
- `heightPotentialCm`, `weightPotentialKg` (cap)
- `growthCurve` parameters (age/growth stage), plus a “fulfillment” factor.

**Fulfillment rule:** not all rikishi reach their potential. Outcomes depend on:
- training intensity and program fit
- injury history
- nutrition/facility quality
- “discipline”/personality traits (if modeled)

## 7.3 Style Evolution (New Canon)
Style is a **current label**, not a birth label:
- `oshi` tends to correlate with rising mass + power + aggression and comfort with distance.
- `yotsu` tends to correlate with grip skill, balance, and comfort in close contact.
- `hybrid` emerges when both pathways remain viable or coaching emphasizes adaptability.

**Update rule (example):** after each basho (or quarterly), recompute a style score from:
- physique deltas (mass/height changes)
- observed move usage (kimarite distribution)
- grip outcomes (belt-dominant frequency)
- coaching emphasis + archetype (soft influence)

Style can drift gradually (avoid abrupt flips), with hysteresis/thresholds.

## 7.4 Dynamic Attributes
- Fatigue (0–100)
- Momentum/form (e.g., -10 to +10)
- Injury status + weeks remaining  
Injury risk scales upward with **mass + fatigue + intensity**.

## 7.5 Tokui-waza (Signature Moves) — now linked to development
- `favoredKimarite` begins empty or lightly seeded.
- After each win, increment usage for the winning kimarite.
- Maintain top 2–3 as “favorites” for UI and for selection weighting.

**Development effect:**  
As physique/style evolves, the favored pool should drift:
- gaining weight/power may increase force-out success → `oshidashi/yorikiri` rise
- agility + lateral movement may raise trips/pulls
- belt skill development pushes throws/twists

---

# 7.6 Tactical Archetypes (Keep 5, Expanded)

> Archetype = behavioral bias layer.  
> Style = technical/strategic label derived from outcomes and attributes.  
> They usually correlate, but do not have to.

### 1) Oshi Specialist (Pusher/Thrusting)
- **Core idea:** wins the match before grips matter.
- **Identity in logs:** “straight-line violence”, relentless pressure, crowd-pleasing push outs.
- **Strength profile:** high power/aggression; mass amplifies forward drive; balance prevents self-collapse.
- **Bout behaviors:** strong tachiai; maintains separation; punishes hesitation.
- **Weakness profile:** vulnerable to lateral disruption and reactive counters (Speedster/Trickster).
- **Kimarite bias:** `force_out`, `push`, `thrust` with `gripNeed: none`.
- **Coaching knobs:** improve balance and footwork to reduce slap-down losses.

### 2) Yotsu Specialist (Belt Fighter)
- **Core idea:** control first, finish second.
- **Identity in logs:** “clinical grappler”, wins the inside war, dominant mawashi narratives.
- **Strength profile:** technique/experience/balance; grip skill compounds over time.
- **Bout behaviors:** may concede tachiai inches to secure grip; thrives in belt-dominant stances.
- **Weakness profile:** if denied grips repeatedly, offense stalls; early tachiai can be a liability.
- **Kimarite bias:** throws/lifts/twists; `gripNeed: belt` with yotsu stances.
- **Coaching knobs:** train entry and grip fighting; add a “plan B” slap/pull to survive no-grip bouts.

### 3) Speedster (Explosive/Evasive)
- **Core idea:** break the opponent’s structure, then cash out quickly.
- **Identity in logs:** “flash”, sudden angle changes, trips, unpredictable repositioning.
- **Strength profile:** speed/agility; lighter mass supports rapid foot placement.
- **Bout behaviors:** high initiative probability; seeks lateral position; can create rear opportunities.
- **Weakness profile:** volatile; if caught square, collapses; fatigue spikes on repeated bursts.
- **Kimarite bias:** trips, evasions, fast slap/pulls; lateral vectors.
- **Coaching knobs:** durability and balance training; teach selective aggression to reduce self-destruction.

### 4) Trickster (Chaos Merchant)
- **Core idea:** weaponize the opponent’s commitment.
- **Identity in logs:** “mind games”, henka threats, bait-and-punish, chaotic finishes.
- **Strength profile:** composure + agility + risk appetite; high counter bonus.
- **Bout behaviors:** invites overextension; chooses reactive techniques; thrives when opponent is linear.
- **Weakness profile:** low direct-force performance; can lose badly if opponent stays disciplined.
- **Kimarite bias:** slap/pulls, trips, “special” opportunistic wins.
- **Coaching knobs:** improve defensive fundamentals; limit overuse of low-percentage moves.

### 5) All-Rounder (Balanced/Adaptive)
- **Core idea:** take what the match gives you.
- **Identity in logs:** “textbook”, efficient and smart, shifts plans mid-bout.
- **Strength profile:** balanced stats; small global synergy bonus; lower volatility than Speedster/Trickster.
- **Bout behaviors:** reads stance/position, selects the best available finish.
- **Weakness profile:** lacks extreme edge; can be outclassed by specialists at their peak.
- **Kimarite bias:** neutral baseline; tends to pick high-frequency finishes that match stance.
- **Coaching knobs:** specialize situationally (anti-oshi toolkit, belt upgrades, etc.).

---

# 8. Combat Engine V3: Phase Model + Kimarite Integration

## 8.1 Phase Model
1. **Tachiai**: determine initiative/advantage from stats + archetype + style + mass.  
2. **Clinch / Grip battle**: set stance (belt-dominant / push-dominant / no-grip / migi-yotsu / hidari-yotsu).  
3. **Momentum ticks**: fatigue and position changes (frontal / lateral / rear), possible advantage recovery.  
4. **Finisher window**: filter 82 kimarite by stance/position/grip and weight them.  
5. **Resolution**: success vs counter, produce narrative log.

## 8.2 How the Kimarite Registry is used
The registry is not just flavor; it is the **action space** for endings.

**Filter pass:**
- remove forfeits
- stance must satisfy `requiredStances`
- position must satisfy `vector` (“rear” only if rear position)
- grip constraints must satisfy `gripNeed`

**Weighting pass (typical):**
- start with `baseWeight`
- add style affinity (oshi/yotsu/hybrid)
- add archetype bonus
- multiply if kimarite class is in archetype preferred classes
- multiply if kimarite is in `favoredKimarite`
- apply stance and position multipliers
- apply rarity dampening (legendary less frequent)

**Counter pass:**
- follower may flip outcome based on balance/experience/technique + archetype counter bonus
- if counter triggers, choose a defensive class subset (throw/trip/slap_pull/twist/evasion)

---

# 9. Banzuke (Ranking) System

## 9.1 Rank Hierarchy (Authentic)
- Makuuchi: Yokozuna, Ozeki, Sekiwake, Komusubi, Maegashira (M1–M17 E/W)
- Juryo (J1–J14 E/W)
- Makushita, Sandanme, Jonidan, Jonokuchi

## 9.2 Kachi-koshi / Make-koshi
- Sekitori (Juryo+): kachi-koshi at **8+ wins** (15 bouts)
- Lower divisions: kachi-koshi at **4+ wins** (7 bouts)

## 9.3 Promotion Notes (Rules of thumb)
- Ozeki: ~33 wins across 3 basho at sanyaku.
- Yokozuna: typically consecutive yusho or equivalent, via deliberation.
- Makushita → Juryo: usually requires high Makushita rank + strong record (7-0 ideal).

---

# 10. Economy: Kenshō, Prestige, Funds

## 10.1 Kenshō
Per banner:
- ¥70,000 total cost basis
- payout (current design):
  - ¥10,000 to stable funds (immediate)
  - ¥50,000 to rikishi retirement fund
  - remainder treated as fees/overhead (narratively consistent)

## 10.2 Prestige
- scalar used to:
  - influence kenshō banners attracted
  - influence rivalry heat and story spotlighting
- prestige decays weekly in Interim.

---

# 11. Rivalries, Seasons, World Events (Targets)

## 11.1 Rivalry Heat (Sprint F)
- Rivalry object between two rikishi:
  - `heat` (0–100), `lastUpdated`, `keyMoments` (log hooks)
- Heat increases on:
  - close matches, upsets, repeated meetings, title races
- Heat decays during Interim.
- Heat modifies:
  - tachiai intensity, risk appetite, narrative tone, and scouting interest.

## 11.2 Scouting (Sprint F)
- “Fog of war” on attributes:
  - some stats hidden until scouted
  - reveal by watching bouts, coach reports, recruitment visits
- Generates “analyst notes” that are also narrative content.

## 11.3 Seasonal Tone (Sprint H)
- Basho has a season (winter/spring/summer/autumn) that flavors:
  - headlines, crowd mood, injuries, travel fatigue, storylets
- Seasonal world events table can tie into succession/governance.

---

# 12. Roadmap (Recalibrated)

**NEXT: Sprint F — Rivalries & Scouting V1.1**
- rivalry heat + decay + UI surfacing
- scouting fog-of-war + reveal mechanics
- hook rivalry into tachiai + commentary

Sprint H/Q — Narrative Hooks & Seasonal Tone  
Sprint I — Governance V1 (kabu availability, full succession, council politics)  
Sprint L/S — FTUE & UI Polish  
Sprint M/T — Analytics & Career Journal

---

# 13. Data & Code Contracts (Types + Helper Modules)

This project is intended to ship with small, well-named TypeScript helpers (no monolith):
- `types.ts`: canonical domain types (Rikishi, Heya, BashoState, WorldState, etc.)
- `banzuke.ts`: rank hierarchy, formatting, kachi-koshi checks, estimate rank change, ozeki kadoban.
- `kimarite.ts`: Option A kimarite registry entries + query helpers (by stance/style/archetype).
- `boutEngineV3.ts`: deterministic multi-phase simulation, produces `BoutResult` + log.

**Important alignment note:**  
The kimarite registry must contain the full 82 official techniques (for the win space). If additional “variant” outcomes exist (otoshi variants, narrative-only endings), they should be treated as *aliases* or *post-processing labels* rather than expanding the official 82 list.

---

End of Consolidated Context v0.4.1

```



## SOURCE — StableLords_MasterContext_v0.4.0_FULL.md

```md
# Stable Lords — MASTER CONTEXT FILE v0.4.0
## Unified Design Bible & Systems Architecture
Date: 2025-11-24  
Status: Fully Synchronized Master File (All Systems Integrated)

---

# 1. CORE VISION & PILLARS

## Pillar 1 — Authenticity
- Six real basho: Hatsu, Haru, Natsu, Nagoya, Aki, Kyushu.
- True banzuke hierarchy.
- Kenshō banners, retirement funds, and realistic sumo economics.

## Pillar 2 — Deterministic Simulation
- All outcomes repeatable under a fixed World Seed.
- Combat Engine V3 is data-driven, using the full 82-kimarite matrix.

## Pillar 3 — Narrative-First
- Every bout produces log-friendly, story-driven commentary.
- Ink.js storylets planned for Rivalries, Seasons, and Press.

## Pillar 4 — Always Playable
- Game runs in offline ZIP builds.
- Save/Load functional via localStorage (Dexie.js mock).
- Missing features handled gracefully.

---

# 2. WORLD SYSTEMS

## 2.1 Time & Calendar
- 6 basho per year.
- Basho Index 0–5 (Hatsu → Kyushu).
- Between basho = 6-week Interim period.
- Time advances daily during basho, weekly during Interim.

## 2.2 Flexible Beya Count (Dynamic World)
- Initial count randomized: **39–45**.
- Beya can close if:
  - Oyakata retires/dies AND no qualified successor.
- Beya can open if:
  - Retired rikishi (Sanyaku-level) meets Oyakata requirements.
- World maintains 35–50 active stables.

## 2.3 Succession Mechanics
### Eligibility:
- Rank ≤ Sekiwake.
- Age ≥ 28.
- Clean conduct.
- No match-fixing flags.
- Must belong to a toshiyori stock line.

### Succession Process:
1. Check candidates.
2. Score based on prestige, record, conduct, loyalty.
3. Pick successor or close beya.

---

# 3. RIKISHI IDENTITY & MANAGEMENT

## 3.1 Permanent Identity
- Unique ID.
- Unique Shikona (weighted Japanese syllables).
- Height, weight, style fixed at generation.
- Player cannot alter physique.

## 3.2 Dynamic Attributes
- Fatigue (0–100).
- Form (momentum).
- Injury Status (risk scaling with weight + fatigue).

## 3.3 Tokui-waza (Signature Moves)
- Top 2–3 winning kimarite become favorites.
- Displayed on Rikishi Card.
- Update after every win.

---

# 3.4 Tactical Archetypes (Expanded)

### 1. Oshi Specialist (Pusher/Thrusting)
- High Power, Aggression, Mass.
- Prefers `force_out` kimarite requiring no grip.
- Strong Tachiai bonus.
- Risks imbalance vs Tricksters and Speedsters.

### 2. Yotsu Specialist (Belt Fighter)
- High Experience, Balance, Discipline.
- Seeks deep mawashi grip immediately.
- Prefers throws: Uwatenage, Shitatenage, Sukuinage.
- Weak initial Tachiai but strong mid-bout control.

### 3. Speedster (Explosive/Evasive)
- High Speed, Agility; lower Mass.
- Prefers lateral vectors and trips.
- High initiative chance.
- Volatile — rapid wins or rapid collapses.

### 4. Trickster (Chaos Merchant)
- High Agility, Composure, Risk Appetite.
- Prefers `slap_pull`, trips, and special moves.
- Henka-capable.
- Low frontal force-out performance.

### 5. All-Rounder (Balanced)
- Even stats.
- Small synergy bonus (+2–3%).
- Chooses optimal kimarite based on position.

---

# 4. COMBAT ENGINE V3

## 4.1 Bout Phases
1. **Tachiai** — speed, mass, aggression produce initiative.
2. **Stance Clashes** — determines grip quality.
3. **Positioning** — frontal, lateral, rear.
4. **Finisher Window** — candidate kimarite selection.
5. **Probability Calculation**.
6. **Resolution** — success, fail, or reversal.

## 4.2 Kimarite Filtering
- Move must match:
  - `vector`
  - `grip_need`
  - `class`
- 82 full moves available.

## 4.3 Probability Formula
P = Base + ΔStats + ΔFatigue + ΔTactic ± RiskSwing

### Stats:
- Force-out: STR + BAL
- Throws: STR + BAL + AGI
- Trips: BAL + AGI
- Slap/Pull: AGI + BAL

### Fatigue:
- Attack fatigue: –12% at max.
- Defender fatigue: +6%.

### Tactic synergy:
- Oshi: force-out boosted, throws penalized.
- Yotsu: throws boosted, slap-pulls penalized.
- Trickster: slap/pull & trips boosted.
- Speedster: initiative & lateral vectors boosted.
- All-rounder: small global buff.

### Risk Swing:
- Risk 1: ±0%
- Risk 5: ±12%

---

# 5. ECONOMY & GOVERNANCE

## 5.1 Kenshō Banners
- ¥70,000 total cost.
- Payout:
  - ¥10,000 to beya funds.
  - ¥50,000 to rikishi’s retirement fund.
- Prestige influences banner count.

## 5.2 Prestige System
- Ranges 0–999.
- Gains from:
  - Wins.
  - Upsets.
  - Beating higher-ranked opponents.
- Decays weekly during Interim.

## 5.3 Governance Hooks
- Yokozuna Deliberation Council reviewed annually.
- Succession review after every basho.
- Conduct flags (chikan, violence, etc.) affect career.

---

# 6. ROADMAP (Updated)

## Sprint F — **Rivalries & Scouting V1**
- Introduce Rivalry Heat scoring.
- Add scouting depth, Fog of War:
  - Hidden stats.
  - Reveal from watching bouts.
  - Analyst reports.
- Add rivalry bonuses in Tachiai tension.

## Sprint H — **Narrative Hooks & Seasonal Tone**
- Event Feed timeline.
- Seasonal Newstype flavoring.
- Spotlight bouts in headlines.

## Sprint I — **Governance V1**
- Full Oyakata Succession system.
- Political events and kabu stock availability.

## Sprint L/S — **FTUE & UI Polish**
- First-time user flow.
- Icons, tooltips, summaries.

## Sprint M/T — **Analytics & Career Journal**
- Recharts visualizations.
- Career logs.
- Year-in-review system.

---

# 7. FILES INCLUDED IN FUTURE BUILDS
- kimarite_matrix.json
- resolveKimarite.ts
- bout_engine_v3.ts
- world_seed.ts
- context.md (this file)

---

End of Document

```



## SOURCE — Stable_Lords_Master_Context_v0.4.0.md

```md
# Stable Lords — MASTER CONTEXT FILE v0.4.0

This is the integrated master context document for Stable Lords. Due to length constraints in this export step, please request the full expanded version and I will regenerate it section-by-section or as a ZIP. This file provides the structural outline and core integrated sections.

## 1. Core Vision & Pillars
- Authentic six-basho cycle, deterministic simulation, narrative-first logs, always-playable builds.

## 2. World Systems
### Time & Calendar
... (full content to be regenerated on demand)

### Flexible Beya Count
39–45 initial, succession/opening/closing rules integrated.

## 3. Rikishi Identity & Management
### Tactical Archetypes (Expanded)
- Oshi Specialist
- Yotsu Specialist
- Speedster
- Trickster
- All-Rounder

(Full expanded descriptions available on request.)

## 4. Combat Engine V3
- Multi-phase engine (Tachiai, Stance, Grip, Finisher)
- Uses full 82-kimarite matrix
- Probability system and modifiers integrated

## 5. Economy & Governance
- Kensho mechanics
- Prestige tracking
- Succession hooks

## 6. Roadmap (Recalibrated)
- Sprint F: Rivalries & Scouting
- Narrative hooks
- Governance V1
- FTUE Polish
- Analytics & Career Journal

```
