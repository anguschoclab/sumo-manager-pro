# Stable Lords — System Interaction Megacontract v1.0 (Ultra‑Granular)
Date: 2026-01-10  
Status: **IMPLEMENTATION‑GRADE / BINDING ORDER-OF-OPERATIONS FOR CROSS‑SYSTEM INTEGRATION**

This document is the **integration spine**: it specifies *how the already-defined systems must talk to each other*, in what order, with what data, and with what guardrails so that the world remains:
- **Deterministic** (same seed + same choices → same world)
- **Legible** (UI/narrative show *meaning*, not engine truth)
- **Institutional** (stables and people persist; consequences accumulate)
- **Sumo-authentic** in cadence, hierarchy, and ceremony

It does **not** re-document every system in full; it defines **interfaces, sequencing, and invariants** so no subsystem can “invent” outcomes or contradict canon.

---

## 0) Source Systems This Megacontract Integrates

This contract integrates the following canonical specs (and their superseding consolidated variants):
- Foundations / World Entry / UI & Observability (world boot, IDs, shikona, FTUE, visibility rules)
- Master Context Canon (narrative-first axioms, gameplay ideals, global constraints)
- Banzuke / Scheduling / Awards (rank structure, torikumi generation, playoffs, prizes, artifacts)
- Combat Engine + Kimarite (bout resolution, technique selection, outcomes, injury hooks)
- Rikishi Development (physique/skills/style/archetype evolution, career arcs)
- Training System (weekly training allocations, fatigue, risk, development shaping)
- Beya Staff & Welfare (capacity limits, coverage, welfare states, staff pipelines)
- NPC Manager AI (profiles, decision loops, meta drift, rivalries, succession)
- Sponsors / Kenshō / Supporters (procedural sponsor generation, banner payments, kōenkai mechanics)
- Sumo PBP / Narrative Rendering (commentary style matrices, special branches, crowd memory)
- Institutional Power / Governance / Scandal / Media (council rulings, sanctions, mergers/closures, narrative pressure)

---

# PART I — GLOBAL INTEGRATION PRINCIPLES

## 1) Determinism & Replay Contract (Cross-System)

### 1.1 One Seed, Many Streams
All randomness is **seeded**. Every subsystem must draw from deterministic streams:
- `worldSeed` (immutable)
- `bashoSeed[bashoId]`
- `daySeed[bashoId, day]`
- `boutSeed[boutId]`
- `uiFlavorSeed[playerSessionId]` *(presentation-only; may vary without changing simulation state)*

**Rule:** Only *presentation* may use `uiFlavorSeed`. **Simulation state must never depend on it.**

### 1.2 No Hidden Dice in Decisions
NPC AI “choices” are deterministic:
- The AI computes a **DecisionScore** for each legal action.
- Ties are broken by stable deterministic ordering (IDs, then lexicographic).

### 1.3 “No Surprises” Rule
A subsystem may not create:
- new restrictions (only governance can)
- new money (only economy flows can)
- new history (only journal/media events can, and only from existing triggers)

**Every output must point to an input cause** (the “source-of-truth chain”).

---

## 2) Canonical Identity & Cross-Referencing

### 2.1 IDs are Primary Keys Everywhere
All cross-system links must use immutable IDs (names are presentation):
- `RikishiID`, `OyakataID`, `BeyaID`, `BashoID`, `BoutID`
- `SponsorID`, `KenshoBannerID`, `SupporterGroupID`
- `GovernanceRulingID`, `MediaEventID`, `JournalEntryID`
- `AwardID`, `PrizeID`

### 2.2 “Entity Surfaces” (UI/Systems share the same conceptual object)
Every entity has:
- `CoreRecord` (immutable identity + origin metadata)
- `StateRecord` (current evolving values)
- `HistoryLog` (append-only events)
- `VisibilityMask[viewer]` (what player/NPC can see)

**Never** duplicate identity across systems. Store once; reference everywhere.

---

## 3) Narrative-First Output Contract (Global)

### 3.1 Numbers are Engine; Words are Player
- Player-facing UI uses **qualitative bands** and **thematic phrasing**.
- Only **hard economy numbers** (salary, banner amounts, facility costs) are allowed as explicit numbers by default.
- Everything else (form, confidence, injury risk, rivalry heat, scandal severity) is shown as **descriptors**.

### 3.2 “Explain the Why” Surfaces
Whenever the game presents a consequence (demotion, sanction, supporter drop), the UI must show:
- **Primary cause**
- **Secondary contributors**
- **What could have prevented it** (if applicable)

These explanations must be narrative, but must map deterministically to underlying triggers.

---

# PART II — CANONICAL TIME & EVENT ORDERING

## 4) Time Scales

### 4.1 Macro: Calendar
- Year contains six honbasho.
- Between basho: training, recruitment, staff management, governance, supporter relations.

### 4.2 Meso: Basho Cycle
- Pre-basho week(s): roster decisions, training emphasis, supporter activation, media simmer.
- Basho days: torikumi schedule, bouts, banners, PBP, injuries.
- Post-basho resolution: awards, payouts, banzuke, governance review.

### 4.3 Micro: Bout
- Ritual + approach + tachiai + exchanges + resolution (+ special branches).
- Combat engine resolves outcomes; PBP renders meaning; economy/governance record effects.

---

## 5) Global Tick Types (Authoritative)

### 5.1 Tick IDs
All simulation writes occur on explicit ticks:
- `WeekTick` (between basho)
- `DayTick` (during basho)
- `BoutTick` (per scheduled bout)

### 5.2 Tick Order Precedence
If multiple subsystems want to write on the same tick:
1. **Governance restrictions** (what is allowed)
2. **Economy** (what can be paid/afforded)
3. **Roster/Staff legality** (foreign slot, capacity)
4. **Training & welfare** (fatigue/injury shaping)
5. **Combat** (bout outcomes)
6. **Banzuke / scheduling artifacts** (after all bouts)
7. **Narrative outputs** (PBP, headlines, journals)
8. **UI visibility projections** (what the player sees)

This ordering is required to prevent retroactive contradictions.

---

## 6) Canonical End-to-End Cycle (One Basho)

### 6.1 Pre-Basho Week (WeekTick N)
**Inputs:** previous banzuke, stable budgets, staff rosters, injuries, rivalry states, supporter states, governance restrictions  
**Writes (in order):**
1. Governance updates effective restrictions (if any) → `ActiveRestrictions`
2. Economy applies weekly operating costs and supporter baseline flows
3. NPC AI and player decisions (recruit/release, staff hire/fire, facility upgrades, loans)
4. Training allocations set `TrainingPlan` for the week
5. Welfare system applies fatigue change, injury recovery/recurrence
6. Generate `BashoSeed` and lock `BashoRosterSnapshot` (the eligible participants)

### 6.2 Basho Day (DayTick D)
**Inputs:** torikumi list, banner allocations, current health/fatigue, style/archetype states  
**Writes (per bout in BoutTick order):**
1. Validate legality (both eligible; no disallowed bouts)
2. Allocate banners and compute stake narrative
3. Resolve combat outcome (kimarite + victory)
4. Apply injury events
5. Record bout to history
6. Emit PBP + crowd reaction
7. Update rivalry/crowd memory
8. Queue economy payout events (kenshō distribution)

### 6.3 Post-Basho Resolution (WeekTick N+1)
**Writes (in order):**
1. Compute standings and resolve playoffs (if needed)
2. Assign awards and special prizes
3. Finalize banner payouts and prestige shifts
4. Generate banzuke via deterministic reassignment algorithm
5. Update rikishi career journals & stable histories
6. Governance review pass (sanction triggers, merger/closure pressures)
7. NPC AI meta drift update (based on observed public outcomes)
8. UI “Basho Recap” surfaces (headlines, journals, budgets, rank changes)

---

# PART III — CROSS-SYSTEM INTERFACE CONTRACTS

This section defines **who owns what**, **what is read**, **what is written**, and **what is forbidden**.

## 7) Banzuke/Scheduling ↔ Combat

### 7.1 Ownership
- **Banzuke/Scheduling** owns: divisions, rank slots, torikumi generation, bout list.
- **Combat** owns: bout outcome (winner/loser), kimarite, victory method, injury events.

### 7.2 Required Inputs to Combat per Bout
- `BoutContext`:
  - `boutId`, `bashoId`, `day`, `division`
  - `eastRikishiId`, `westRikishiId`
  - `rankContext` (rank, rankNumber, side for each)
  - `stakesContext` (yusho contention flags, kachi-koshi pressure bands)
  - `bannerContext` (kenshoCount, sponsorIds)

### 7.3 Required Outputs from Combat
- `BoutResult`:
  - winnerId, loserId
  - kimariteId (from 82 list)
  - winType (force-out, throw, slap-down, etc.)
  - durationBand (instant / brief / extended / stalemate)
  - specialBranch? (mono-ii / torinaoshi / mizui-iri)
  - injuryEvents[]
  - deterministic trace pointer (engine debug, hidden from player)

### 7.4 Forbidden Actions
- Combat may not alter banzuke mid-basho.
- Scheduling may not “choose” winners.

---

## 8) Combat ↔ Rikishi Development (Body/Skills/Style)

### 8.1 Combat Reads (from Development)
- current physique (height/weight), fatigue, injury status
- style (oshi/yotsu/hybrid) and archetype tendencies
- skill outputs (power/speed/balance/technique/experience)
- tokui-waza candidates (favored kimarite families)

### 8.2 Combat Writes (to Development)
- injury events with severity and affected parts
- fatigue deltas
- confidence/momentum *as qualitative* state flags
- kimarite usage ledger (for style/archetype drift proof)

### 8.3 Development Writes (between basho)
- physique evolution (weight drift influenced by training + nutrition)
- skill evolution (growth/diminish patterns)
- style drift (public identity)
- archetype drift (slow; mostly stable)
- tokui-waza updates (proofed by kimarite ledger)

### 8.4 Invariant: Proof Before Identity
A rikishi’s displayed “signature” cannot change unless:
- the ledger shows sustained usage, and
- the narrative surfaces have reflected that change over time.

---

## 9) Training ↔ Welfare/Staff ↔ Development

### 9.1 Training Plan is a Weekly Contract
Training produces:
- `TrainingPlanWeek` per rikishi:
  - focus (technique/strength/speed/balance)
  - intensity band (light/standard/brutal)
  - sparring mix (oshi vs yotsu drills)
  - rest allocation

### 9.2 Staff/Welfare Modifiers (Non-Training Effects)
Staff and facilities do **not** directly grant skill points; they shape:
- ceilings (what is achievable)
- forgiveness (how fast fatigue decays; injury recurrence)
- variance (how often setbacks occur)

### 9.3 Capacity Enforcement
If roster exceeds staff capacity:
- welfare risk increases
- recovery slows
- training gains flatten
This is computed deterministically from coverage ratio.

### 9.4 Welfare States Feed Back Into AI & Narrative
Welfare has qualitative states that affect:
- NPC AI risk tolerance
- media scrutiny if repeated
- supporter sentiment (seen as “mismanagement”)

---

## 10) Economy/Sponsors ↔ Banzuke/Bouts ↔ PBP

### 10.1 Banner Allocation
Sponsors generate banners (`KenshoBanner`) attached to bouts:
- count (0..n)
- sponsor names (presentation)
- sponsor tier (local/regional/national/patron)
- payout schedule (per banner)

### 10.2 Payout Timing
- Banner “parade” and envelope ceremony are rendered **after** bout resolution.
- Economy records:
  - gross banners
  - tax/fees (if modeled)
  - distribution to rikishi and/or stable accounts per ruleset

### 10.3 Narrative Integration
PBP must mention:
- sponsor parade tone (subtle; not an ad read)
- the ceremony of envelopes when applicable
- optionally 1–3 sponsor names based on regional broadcast tone

**Rule:** Sponsor names shown are a *sample*; the economy ledger holds the full list.

---

## 11) Governance/Scandal ↔ Economy/Supporters ↔ AI

### 11.1 Governance Overrides
Governance can impose restrictions that affect:
- recruitment bans
- tournament participation restrictions
- supporter visibility and decay modifiers
- forced merger/closure pipeline

Governance rulings are immutable once issued and must carry IDs and effective ticks.

### 11.2 Scandals as Multi-System Events
A scandal is never “just narrative”.
It is a structured event with:
- trigger source (welfare neglect, loan strings, media exposure)
- governance review outcome (sanction ladder)
- economy consequence (supporters drop; sponsor hesitancy)
- AI consequence (succession urgency; risk posture change)
- rivalry consequence (scrutiny amplification)

### 11.3 Loan/Benefactor Strings Become Governance Hooks
If a stable takes a loan/benefactor rescue:
- it may create obligations (“strings”) that governance can later treat as leverage.
- repeated dependence increases sanction susceptibility.

---

## 12) Rivalries ↔ Everything (Distortions, Not Cheats)

Rivalry exists at three layers:
- rikishi↔rikishi
- oyakata↔oyakata
- stable↔stable

### 12.1 Rivalry Modifies Weighting, Not Legality
- Rivalry never creates new actions.
- Rivalry shifts **priority and tolerance thresholds**.

### 12.2 Cross-System Rivalry Touchpoints
- **Scheduling:** rivalry may increase headline emphasis but not torikumi legality.
- **Combat:** rivalry affects narrative stakes only, not outcome odds.
- **AI:** rivalry biases recruitment, training emphasis, economic risk posture.
- **Governance:** rivalry increases scrutiny tier when already triggered.
- **Media:** rivalry increases frequency and harshness of phrasing.

---

## 13) Career Journals ↔ PBP ↔ Media Headlines

### 13.1 Journal Entries Are Derived, Not Invented
Journal writes occur only from:
- bouts
- rank changes
- awards
- scandals/governance rulings
- supporter windfalls/collapses
- rivalries escalating/cooling

### 13.2 PBP as the “Language Reservoir”
PBP provides:
- phrasing variants
- crowd reaction vocabulary
- regional tonal filters
These feed:
- headlines
- journal excerpts
- stable lore blurbs

### 13.3 Staff-Driven Headline Generators
Staff events (coach hire/fire, welfare reforms, medical miracles, neglect) generate headlines:
- success: “rebuilt”, “revitalized”, “discipline restored”
- scandal: “under scrutiny”, “questions mount”, “council intervenes”
The generator must:
- cite the underlying event IDs
- respect tone filters (Tokyo restrained vs Fukuoka expressive)

---

# PART IV — INTEGRATION MATRICES & REQUIRED DATA CONTRACTS

## 14) Integration Matrix (What Reads/Writes What)

Legend: **R**=reads, **W**=writes, **E**=emits events, **Ø**=no access

| System \ System | World/IDs | Banzuke | Combat | Dev | Training | Staff/Welfare | Economy/Sponsors | Governance/Media | AI | PBP/Journals/UI |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| World/IDs | W | R | R | R | R | R | R | R | R | R |
| Banzuke | R | W | E | R | Ø | Ø | R | R | R | E |
| Combat | R | R | W | E | Ø | R | R | R | Ø | E |
| Development | R | R | R | W | R | R | Ø | Ø | R | R |
| Training | R | Ø | Ø | E | W | R | Ø | Ø | R | R |
| Staff/Welfare | R | Ø | R | E | R | W | R | R | R | R |
| Economy/Sponsors | R | R | R | Ø | Ø | R | W | R | R | E |
| Governance/Media | R | R | Ø | Ø | Ø | R | R | W | R | E |
| AI | R | R | Ø | R | R | R | R | R | W | E |
| PBP/Journals/UI | R | R | R | R | R | R | R | R | R | W |

**Key invariant:** narrative/UI systems never write simulation truth; they write **rendered artifacts** only.

---

## 15) Event Bus (Authoritative)

All cross-system notifications occur via an append-only `WorldEventLog`.

### 15.1 Event Shape
```
WorldEvent {
  id: EventID
  tick: TickID
  type: string
  entities: { rikishiIds[], beyaIds[], oyakataIds[], sponsorIds[] }
  payload: object  // deterministic, minimal
  cause?: { eventId: EventID }  // causal chain
}
```

### 15.2 Mandatory Event Types
- `WORLD_BOOT_COMPLETE`
- `BASHO_CREATED`
- `TORIKUMI_PUBLISHED`
- `BOUT_RESOLVED`
- `INJURY_OCCURRED`
- `AWARDS_ASSIGNED`
- `BANNER_PAYOUT_FINALIZED`
- `BANZUKE_PUBLISHED`
- `SUPPORTER_STATE_CHANGED`
- `GOVERNANCE_RULING_ISSUED`
- `MEDIA_EVENT_PUBLISHED`
- `AI_DECISION_LOGGED`
- `JOURNAL_ENTRY_WRITTEN`

---

## 16) Data Contracts (Minimum Required Fields)

### 16.1 StableStateSnapshot (per WeekTick)
- finances: cash, runway band, fixed costs, variable costs
- supporters: kōenkai tier, loyalty band, active pledges
- staff: roster, capacity ratios, welfare policy flags
- facilities: levels, upkeep
- governance: restrictions, kabu status, scrutiny band
- rivalry: key rival tiers and trend descriptors

### 16.2 RikishiStateSnapshot (per DayTick + post-bout)
- rank context
- physique (height/weight)
- health: fatigue band, injury flags
- identity: style descriptor, archetype descriptor, tokui-waza descriptor
- record: wins/losses in current basho
- narrative: crowd memory band (public), controversy band (public)

### 16.3 SponsorContract (procedural)
- sponsorId, tier, region, industry, brand tone
- budget band, banner willingness band
- scandal sensitivity band
- kōenkai adjacency (if any)

---

# PART V — REQUIRED “INTERACTIONS THAT MUST EXIST” (CHECKLIST)

This section is a QA list: if any bullet is missing in implementation, the systems are not integrated.

## 17) Bouts → Everything Pipeline (Must Work)
When `BOUT_RESOLVED`:
- record updates for both rikishi
- kimarite ledger updates
- fatigue/injury updates
- banner payout queued (if banners)
- rivalry state may update
- crowd memory updates
- PBP artifact produced with:
  - ritual flavor
  - flow narrative (no phase headings)
  - winning kimarite mentioned
  - sponsor ceremony mention if banners
  - special branch narration if mono-ii/torinaoshi/mizui-iri

## 18) Post-Basho → Rank → Economy → Narrative (Must Work)
When `BANZUKE_PUBLISHED`:
- salaries/allowances update for sekitori changes (economy)
- supporter interest updates (economy)
- AI planning updates (AI)
- journal entries for promotions/demotions (narrative)
- headlines for yusho/kinboshi/sansho (narrative)

## 19) Welfare Neglect → Scandal → Governance → Economy (Must Work)
If welfare risk is repeatedly ignored:
- scandal event triggers
- governance ruling created (stepwise sanctions)
- sponsor willingness reduced
- supporters decay faster
- AI forced into policy changes or succession pressures

## 20) Loans/Benefactors → Strings → Governance Hooks (Must Work)
If a stable accepts rescue:
- debt schedule is created
- “strings” are logged
- later governance can convert strings into restrictions
- narrative reflects “shadow patronage” without inventing facts

---

# PART VI — END-TO-END EXAMPLE (ONE DAY, ONE BOUT)

This is an integration demonstration, not “content”.

1) `TORIKUMI_PUBLISHED` lists BoutID BT-… with East/West rikishi IDs.  
2) Sponsors allocate 5 banners; sponsor IDs attached.  
3) `BOUT_RESOLVED` (combat engine) outputs winner + kimarite + duration band.  
4) Economy queues banner payout event.  
5) PBP renderer produces narrative with:
   - dohyo/ritual
   - tachiai impact
   - grappling flow
   - winning kimarite call
   - envelope ceremony mention + sampled sponsor names
6) Crowd memory updates; journal writes a “moment” entry if notable.  
7) AI logs updated perception snapshot (no numbers) for future decisions.

---

# PART VII — IMPLEMENTATION NOTES (NON-NEGOTIABLE)

## 21) Single Source of Truth Rules
- Banzuke determines eligibility; combat cannot bypass it.
- Governance determines legality; economy/AI must comply.
- Economy determines affordability; AI intent cannot overspend.
- Narrative systems determine phrasing; they cannot alter outcomes.

## 22) Debuggability Without Spoiling
Every major output has:
- `publicExplanation` (qualitative)
- `privateTrace` (hidden, dev-only)

Players see “why” but never the raw math.

---

# PART VIII — OPEN HOOKS (FORWARD-DECLARED, NOT REQUIRED TO SHIP)

These hooks may exist as stubs without active gameplay:
- Naturalization freeing foreign slot (rare, prestige-gated)
- Advanced council factions/politics (Governance V2)
- Expanded sponsor politics (anti-rival sponsor boycotts)
- Career journal analytics dashboards

---

## End of Megacontract v1.0
