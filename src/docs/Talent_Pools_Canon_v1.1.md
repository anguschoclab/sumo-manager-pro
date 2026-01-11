# Stable Lords — Talent Pools & Institutional Pipelines Canon v1.0
## Ultra-Granular, Implementation-Grade Specification (Foundations Layer)

**Status:** DEFINITIVE (Foundations-owned)  
**Scope:** Procedural generation and lifecycle of *available people* and *institutional candidates* in the world:
- New **rikishi intake pools** (domestic + foreign)
- **Staff / coach labor markets**
- **Oyakata / kabu successor pools**
- **Officials & support roles** (medical, admin, scouts)
- **Pipelines** between these pools (e.g., retired rikishi → coach → oyakata candidate)
- **Visibility / scouting / fog-of-war** constraints on pools
- Deterministic refresh cadence, competition, and depletion rules

**Out of scope:** bout resolution, banzuke math, economy amounts (those consume pool outputs).  
**Design mandate:** deterministic, replay-safe, non-random-feeling, and larger/denser than any implied references.

---

## 0. Why Pools Exist (Design Laws)

### 0.1 Scarcity is gameplay
Pools are the **supply-side physics** of Stable Lords. They create:
- genuine competition (AI and player fighting over the same candidates)
- narrative plausibility (eras of talent drought/booms)
- difficulty that emerges from world state (not sliders)
- governance pressure (kabu scarcity, succession crises)
- economic pressure (wage inflation, sponsor confidence tied to “star supply”)

### 0.2 Pools are not “spawns”
A pool is **a finite, persistent set of candidates** with:
- identity
- history
- competing suitors
- eligibility gates
- visibility constraints

### 0.3 Determinism
All pool outcomes are deterministic functions of:
- `WorldSeed`
- `EraSeed` (derived from WorldSeed + decade index)
- `CalendarIndex` (year/week/month)
- `InstitutionState` snapshots (prestige, scandals, sanctions, finances)
- `PoolState` (who is already in/out, who was hired, who is locked)

No runtime RNG.

---

## 1. Canonical Pool Types (World Truth)

### 1.1 Primary Pools (People)
1) **Rikishi Intake Pool (Domestic)**  
2) **Rikishi Intake Pool (Foreign)**  
3) **Staff Labor Pool** (coaches, conditioning, admin, scouts, etc.)  
4) **Medical Labor Pool** (doctors, physios, therapists)  
5) **Oyakata Candidate Pool** (kabu-eligible succession candidates)

### 1.2 Secondary Pools (Institutional roles)
6) **Officials Pool** (gyoji candidates, yobidashi candidates, tokoyama candidates) — optional if modeled  
7) **Media / PR Pool** (journalists, commentators) — optional, narrative only

> Note: Sponsors are “actors” but are specified in the sponsor canon. This document only provides *people pools* and pipelines.

---

## 2. Shared Data Model (All Pools)

### 2.1 Pool Identity
Each pool is uniquely identified:
- `poolId = hash(WorldSeed, PoolType, Region?, EraIndex?)`

### 2.2 Pool State Object
```ts
TalentPoolState {
  poolId
  poolType
  refreshCadence: "weekly" | "monthly" | "basho" | "yearly"
  populationCap: number               // maximum listed candidates at once
  hiddenReserveCap: number            // unseen candidates (fog-of-war buffer)
  candidatesVisible: CandidateId[]
  candidatesHidden: CandidateId[]
  lastRefreshTick: number
  scarcityBand: "plentiful" | "normal" | "tight" | "scarce" | "crisis"
  qualityBand: "low" | "normal" | "high" | "golden_age"
  churnRules: ChurnRuleSet
  eligibilityRules: EligibilityRuleSet
}
```

### 2.3 Candidate Object (Normalized)
All candidates share a base schema; role-specific extensions apply.

```ts
CandidateBase {
  candidateId
  personId                     // permanent identity id if promoted into world
  name
  birthYear
  originRegion
  nationality
  citizenshipFlags             // supports dual citizenship
  visibilityBand               // what the player can know without scouting
  reputationSeed               // latent reputation potential
  scandalFlags?                // if any (rare at entry)
  tags[]                       // narrative tags (e.g., "disciplined", "volatile")
  availabilityState: "available" | "in_talks" | "signed" | "locked" | "withdrawn"
  competingSuitors: SuitorRef[]
}
```

### 2.4 SuitorRef
```ts
SuitorRef {
  beyaId
  interestBand: "low"|"medium"|"high"|"all_in"
  offerType: "standard"|"aggressive"|"prestige_pitch"|"covert"
  deadlineTick
}
```

---

## 3. Visibility, Scouting, and Fog-of-War (Pool Layer)

### 3.1 Visibility bands
Candidates have a **VisibilityBand** that controls what is revealed:

| Band | Player can see by default |
|---|---|
| Public | Name, age, origin, headline traits |
| Rumored | Name + vague descriptor (“strong amateur record”) |
| Obscure | Only existence (“unknown prospect in region”) |
| Hidden | Not listed until discovered |

### 3.2 Scouting reveals, not creates
Scouting:
- moves candidates from `Hidden` → `Obscure` → `Rumored` → `Public`
- increases precision of competence bands
- reveals hidden tags (injury risk, temperament, corruption risk)

### 3.3 AI symmetry rule
NPC stables operate under **the same pool**.
They may have different scouting reach, but **cannot access non-existent candidates**.

---

## 4. Rikishi Intake Pools (Domestic + Foreign)

### 4.1 Intake cadence
Rikishi intake refreshes **yearly** with **monthly trickle**:

- **Yearly intake generation**: creates the new cohort (ages 15–19 typical, tunable)
- **Monthly trickle**: reveals subsets of the cohort based on scouting visibility

This prevents “January hiring rush only” behavior.

### 4.2 Domestic intake generation (deterministic)
Generated from:
- `EraQualityBand`
- `RegionTalentBand`
- `InstitutionPrestigeBand` (sumo popularity)
- recent scandal pressure (reduces intake)

Outputs:
- cohort size
- distribution of body potentials (height/weight potentials)
- distribution of talent seeds
- distribution of temperament tags

### 4.3 Foreign intake generation
Foreign intake is generated as a **separate pool** with gates:

- pool size is limited per year (world plausibility + foreigner rule pressure)
- candidates have nationality and citizenship metadata
- **Dual citizenship** is allowed:
  - `citizenshipFlags = {primary, secondary?}`
  - eligibility for “foreigner slot” depends on governance rule:
    - default: **foreign slot applies unless Japanese citizenship exists**
    - optional: apply stricter interpretation if desired

### 4.4 Foreigner limits integration (hard rule)
When evaluating a candidate signing:
- if candidate counts as “foreign” under the rule,
- and beya already has max foreign quota,
- candidate cannot be signed (UI must explain).

The pool system does **not** override governance.

### 4.5 Recruitment competition model
When a candidate is visible:
- eligible stables compute interest bands deterministically:
  - need (roster gaps)
  - prestige pitch
  - finances
  - scandal risk tolerance
  - rivalry pressures

Candidate has a preference model (deterministic):
- stability preference (prestige)
- development preference (coach reputation)
- location preference (region ties)
- risk preference (aggressive offers vs safety)

Signing resolves as:
- **offer window** (weeks)
- **resolution tick** where candidate chooses highest utility offer
- candidates can remain unsigned and drift into obscurity (withdrawn state)

### 4.6 “Amateur star” injection
To create headline prospects, the pool can create rare “amateur star” candidates:
- very high talent seed
- high public visibility
- many suitors
- strong preference rules (prestige + coach quality)

This is deterministic, rare, and era-weighted.

---

## 5. Staff / Coach Labor Pools

### 5.1 Staff categories
Staff pool includes:
- technique coaches
- conditioning coaches
- nutritionists
- scouts
- administrators
- mental coaches (rare)

Medical pool is separate (see §6).

### 5.2 Supply generation
Supply is generated from:
- retired staff exits
- retired rikishi pipeline (see §7)
- “external professional” pipeline (rare, expensive, high variance)
- scandal expulsions (reduce supply)

Cadence: **monthly refresh**, with some yearly graduation events.

### 5.3 Staff candidate attributes
Staff candidates have:
- competence bands (primary/secondary)
- career phase (apprentice/established/senior)
- reputation band
- loyalty bias (e.g., prefers certain stable styles)
- scandal exposure risk

### 5.4 Hiring competition
Hiring uses the same suitor mechanism:
- stables bid with salary bands + role + narrative pitch
- candidate preference includes:
  - salary
  - prestige
  - stability (welfare, compliance)
  - autonomy (will they be blamed)
  - rivalry considerations (avoid hated stable)

### 5.5 Replacement pressure
When a stable loses staff (retirement/scandal/poaching):
- it must fill role or accept operational penalties
- AI will preemptively hire if risk signals rise

---

## 6. Medical Labor Pool (Welfare Critical)

### 6.1 Why separate
Medical staff affects:
- injury escalation curves
- welfare risk accumulation
- scandal triggers (negligence)
- governance sanctions

Thus medical supply must be explicitly scarce.

### 6.2 Cadence and scarcity
Cadence: **monthly**
Scarcity bands are influenced by:
- era (medical modernity)
- scandal climate (doctors avoid risky stables)
- economy (can you pay)

### 6.3 Medical credential gating
Medical candidates have credential tiers:
- basic
- certified
- elite

A stable under investigation may be restricted to certified+.

### 6.4 Liability memory
Medical candidates track:
- “prior scandal association”
- “complaint history”
They may refuse offers from stables with a bad welfare record.

---

## 7. Oyakata & Kabu Successor Pools

### 7.1 Kabu scarcity is structural
The kabu successor pool is not “generated freely.”
It is constrained by:
- kabu availability
- candidate eligibility (years served, reputation)
- council tolerance

### 7.2 Candidate sources (pipelines)
Candidates enter the pool from:
- retiring rikishi with sufficient reputation
- assistant oyakata promotions
- institutional administrators (rare)
- council appointments (very rare)

### 7.3 Eligibility gates (deterministic)
A candidate is eligible if:
- meets age + service requirements (configurable)
- reputation above threshold
- scandal exposure below threshold
- council relations not hostile

### 7.4 Succession competition
When a kabu becomes available:
- eligible candidates appear in the pool (visible to relevant actors)
- stables/council factions may back candidates
- outcomes are deterministic and recorded in governance history

---

## 8. Pipelines (The Heart of the System)

Pipelines are **state machines** that move people between pools.

### 8.1 Pipeline: Rikishi → Retired
Trigger conditions:
- retirement decision
- forced retirement (injury/governance)
Outputs:
- retired personId persists
- enters “post-career roles consideration”

### 8.2 Pipeline: Retired Rikishi → Coach Candidate
Eligibility:
- technical style fit
- reputation
- temperament tags
- willingness preference

This produces a new candidate in Staff Pool with:
- “ex-rikishi” tag
- technique competence bias tied to former style/archetype

### 8.3 Pipeline: Coach → Assistant Oyakata
Eligibility:
- tenure at beya
- loyalty band
- council reputation
- kabu plan exists

### 8.4 Pipeline: Assistant Oyakata → Oyakata Candidate Pool
A candidate enters the kabu pool when:
- kabu opportunity exists OR candidate seeks one
- candidate meets eligibility gates

### 8.5 Pipeline: Scandal → Expulsion / Cooling-off
Staff or coaches can be:
- suspended (cooling off pool, time-locked)
- expelled (permanent removal from eligible pools)
- rehabilitated (rare, requires clean years + narrative repair)

All outcomes are deterministic and logged.

---

## 9. Era Drift & Macro Supply (Boons and Droughts)

### 9.1 EraQualityBand
Every decade (or configurable window), the world computes:
- `EraQualityBand` for rikishi
- `EraStaffBand` for coaches/medical
- `EraPopularityBand` for sumo as institution

Derived deterministically from:
- historical prestige
- scandal climate
- sponsor health
- “legendary generation” memory

### 9.2 Effects
- Golden age: more high-end prospects, more sponsors, more staff supply
- Drought: fewer prospects, higher wage pressure, more risky hires
- Scandal era: reduced intake, reduced medical supply, harder governance

---

## 10. Pool Depletion, Locking, and Churn

### 10.1 Depletion
Once signed:
- candidate moves to `signed`
- removed from other stables’ visible lists
- identity promoted to a world person

### 10.2 Locking
Some candidates are “locked” due to:
- age (not ready)
- eligibility not met
- ongoing investigations
- visa/citizenship restrictions

### 10.3 Churn
Unsold candidates may:
- withdraw (join other life path)
- become obscure
- reappear later via “late starter” rule (rare)

Churn is deterministic and explained by narrative tags.

---

## 11. Interaction Hooks (Cross-System Contracts)

This section specifies **exactly who consumes what** from pools.

### 11.1 Beya Management consumes:
- candidate lists (staff and rikishi)
- scarcity bands (for decision weighting)
- replacement time-locks

### 11.2 NPC Manager AI consumes:
- visibility-filtered candidate lists
- scarcity + quality bands
- rival hiring events (narrative + strategy)

### 11.3 Economy consumes:
- wage pressure index derived from staff scarcity
- sponsor confidence (indirectly affected by star supply)

### 11.4 Governance consumes:
- kabu candidate pool membership
- eligibility flags
- scandal rehabilitation timers

### 11.5 Narrative / Journals consumes:
- “signing events”
- “poaching events”
- “succession appointment events”
- “drought/boom” era announcements

---

## 12. Event Taxonomy (Pool Events)

Pools emit canonical events:

| Event | Payload |
|---|---|
| CandidateRevealed | candidateId, poolId, visibilityBand |
| OfferSubmitted | candidateId, beyaId, offerBand |
| CandidateSigned | personId, beyaId, contractType |
| CandidateWithdrawn | candidateId, reasonTag |
| StaffPoached | staffId, fromBeyaId, toBeyaId |
| KabuVacancyOpened | kabuId |
| KabuAssigned | kabuId, candidateId |
| EraBandShifted | eraIndex, bandType, newBand |

All events are deterministic, loggable, and replay-safe.

---

## 13. UI Surfaces (Narrative-first)

### 13.1 Player-facing language
Players see:
- “The amateur scene is brimming this year.”
- “Medical staff are scarce; reputations travel fast.”
- “A promising teenager is rumored in Kyushu.”

Players do not see:
- raw pool sizes
- hidden reserve counts
- exact preference utilities

### 13.2 Stable selection (difficulty)
When picking a stable, the UI shows:
- stable stature
- coach quality
- recruiting reach
- sponsor base

This indirectly changes pool access via visibility/scouting capacity.

---

## 14. Implementation Notes (Non-negotiable)

### 14.1 No duplicated generation
Pools are the only generator of new people.  
No other system may “create a coach” or “spawn a prospect.”

### 14.2 Identity promotion
Only when signed does a Candidate become a full Person (world entity).

### 14.3 Auditability
Every pool change must create:
- ledger line (if economic)
- governance log (if political)
- narrative memory entry (if notable)

---

## 15. Annex — Integration Checklist (Where to Reference This Doc)

Add delegation notes to:
- Foundations / World Entry: “Population intake uses Pools Canon v1.0”
- Beya Staff & Welfare: “Staff hiring uses Pools Canon v1.0”
- NPC Manager AI: “AI hiring uses Pools Canon v1.0”
- Governance: “Kabu candidates come from Pools Canon v1.0”
- Scouting/Fog-of-War: “Visibility bands defined in Pools Canon v1.0”
- Narrative/Journals: “Signing and poaching events defined in Pools Canon v1.0”

---

**END OF DOCUMENT**



---

# APPENDIX A — Worked Example Year (Implementation Test Case)

This appendix provides a deterministic “one year in the world” timeline showing:
- pool refresh cadence
- visibility reveal
- recruitment competition
- staff poaching
- medical scarcity event
- kabu vacancy + assignment
- event emissions and which systems consume them

It is intended as a **QA harness spec**: engineers can simulate this exact year and assert identical event logs.

## A0. Setup (Fixed Seeds & Starting Conditions)

### A0.1 Seeds
- WorldSeed: `0xSL-2037-ALPHA`
- EraIndex: `2030s-2` (derived)
- Calendar Year: `2037`

### A0.2 Institution Snapshot at Year Start (Bands only)
- National prestige: **High**
- Scandal climate: **Normal**
- Sponsor health: **High**
- Council tolerance: **Normal**
- Medical labor scarcity: **Tight**
- Recruitment popularity (sumo intake): **High**

### A0.3 Player Stable (for example)
- Beya: **Kitasakura-beya**
- Stature: **Mid-table**
- Recruiting reach: **Adequate**
- Staff quality: **Adequate**
- Foreign slot used: **0 / 1**
- Welfare record: **Compliant**
- Finances: **Stable**

### A0.4 Example NPC Stables (for competition)
- **Tenkō-beya** (elite, high prestige, aggressive recruitment)
- **Minatogawa-beya** (low prestige, bargain hunting)
- **Shiranui-beya** (mid prestige, staff-heavy development)

---

## A1. Yearly Intake Generation (January 1)

### A1.1 Domestic Rikishi Intake Pool — Cohort Generation
Pool refresh: **yearly**
- Cohort size generated: **N = 42** (hidden reserve + visible list cap applied)
- Visible cap: **12**
- Hidden reserve: **30**

Outcome bands:
- 4 “headline” prospects (Public/Rumored)
- 14 “strong” prospects (Rumored/Obscure)
- 24 “longshot” prospects (Obscure/Hidden)

Emitted events:
- `EraBandShifted` (if decade-level recalculated)
- *No CandidateRevealed events yet* (reveals happen monthly via trickle)

### A1.2 Foreign Rikishi Intake Pool — Cohort Generation
- Cohort size: **N = 6**
- Visible cap: **3**
- Hidden reserve: **3**
- Dual citizenship candidates: **1** (flagged)

Eligibility:
- Counts toward foreign quota unless Japanese citizenship exists (default rule)

---

## A2. Monthly Trickle & Scouting Reveals (Jan–Dec)

Each month, pools execute:
1) Reveal pass (moves some Hidden → Obscure, Obscure → Rumored, Rumored → Public)
2) Suitor interest recompute pass
3) Offer window resolution pass for candidates whose deadline arrives

### A2.1 January Reveal
Domestic reveals:
- 2 candidates become **Public** (headline prospects)
- 3 become **Rumored**
Foreign reveals:
- 1 becomes **Public**, 1 becomes **Rumored**

Emitted:
- `CandidateRevealed` × 7

Consumption:
- Scouting/UI: updates “rumor board”
- NPC AI: computes interest bands
- Narrative/Journals: may create “New Year Prospects” article if Public reveals ≥2

### A2.2 February: First Offer Window Opens
Player stable scouts a Rumored domestic prospect (Candidate D-07) → becomes Public.

Player submits offer:
- Offer type: `prestige_pitch` (narrative promise of fast development)
NPC stables submit:
- Tenkō: `aggressive`
- Shiranui: `standard`

Emitted:
- `OfferSubmitted` × 3

Candidate preference resolution tick (end of Feb):
- Candidate chooses **Tenkō** (highest utility; prestige dominates)

Emitted:
- `CandidateSigned` (personId promoted)
- Narrative hook: “Elite stable secures top amateur”

### A2.3 March: Staff Market Refresh + Poaching
Staff pool monthly refresh reveals a Senior Technique Coach candidate (S-22) Public.

Shiranui offers high salary band; player offers standard.
Coach prefers Shiranui (autonomy + prestige).

Emitted:
- `CandidateSigned` (staff)
- If coach came from another stable: `StaffPoached` (not in this case)

### A2.4 April: Medical Scarcity Shock
Medical pool scarcity band shifts: **Tight → Scarce** (deterministic due to high national injury rate + scandal climate drift).

Effects:
- fewer candidates revealed
- certified/elite candidates raise refusal probability for scandal-marked stables

Emitted:
- `EraBandShifted` (bandType = medical_supply)

Consumption:
- Beya Welfare: raises hiring urgency
- NPC AI: reduces risky training choices
- Narrative: “Medical staff scarce across the stables”

### A2.5 May: Player Signs First Recruit
Candidate D-19 (Rumored) chooses player stable due to:
- development promise
- low scandal risk
- local region tie

Emitted:
- `CandidateSigned` (rikishi)

World effects:
- Beya roster grows
- Training pipeline activates
- Narrative: “Quiet signing with local roots”

### A2.6 June: Foreign Candidate & Quota Check
Foreign candidate F-02 becomes Public. Player attempts offer.

Quota check:
- Player foreign slot used: 0/1 → eligible
Candidate has dual citizenship but no Japanese flag → counts foreign.

NPC Tenkō also offers.
Candidate chooses player due to “opportunity to become stable centerpiece” utility.

Emitted:
- `CandidateSigned` (foreign rikishi)
- Narrative: “Foreign prospect commits to Kitasakura-beya”

### A2.7 July: Candidate Withdrawals & Churn
Two longshot domestic candidates time out, withdraw (education path).

Emitted:
- `CandidateWithdrawn` × 2 (reasonTag: “returns_to_school”)

Consumption:
- Pools: reduce hidden reserve
- Narrative: generally none (unless notable)

### A2.8 August: Mid-year Amateur Star Injection (Rare)
A deterministic “amateur star” event triggers (era band + year index).

Candidate STAR-01 appears immediately **Public** with many suitors.
Offer war:
- Elite stables bid aggressively
- Player can bid but utility is usually dominated

Outcome:
- STAR-01 signs to Tenkō.

Emitted:
- `CandidateRevealed`
- `OfferSubmitted` × many
- `CandidateSigned`

Narrative:
- Major headline guaranteed

### A2.9 September: Staff Burnout Replacement
A mid-table stable loses Medical Staff to retirement; triggers replacement hiring.
A certified doctor candidate accepts Shiranui due to strong welfare record.

Emitted:
- `CandidateSigned` (medical staff)

### A2.10 October: Kabu Vacancy Opens
An oyakata retires → kabu vacancy event.

Emitted:
- `KabuVacancyOpened`

Candidate pool construction:
- eligible candidates enumerated deterministically
- two assistant oyakata + one retired rikishi appear as candidates

Emitted:
- `CandidateRevealed` (oyakata candidates) × 3

Council factions preference:
- favor clean record + continuity

Resolution:
- Assistant Oyakata A-02 assigned kabu

Emitted:
- `KabuAssigned`

Narrative:
- “Council approves succession, stability maintained”

### A2.11 November: Poaching Event
A well-regarded Conditioning Coach is poached from Minatogawa by Tenkō.

Emitted:
- `StaffPoached`

Consumption:
- Rivalry system increases tension between stables
- Media: “poaching controversy” if Minatogawa complains

### A2.12 December: Year Close Consolidation
Pools perform end-of-year:
- churn reconciliation
- hidden reserve carryover
- era band recalculation check for next year

Emitted:
- `EraBandShifted` (if any)
- No forced reveals

---

## A3. Required Assertions (QA Harness)

A simulator implementation should be able to assert:

1) Candidate lists and reveal counts per month match
2) Offer submission ordering and resolution outcomes match
3) Foreign quota blocks illegal signings deterministically
4) Medical scarcity shift occurs in April (given seeds)
5) Kabu vacancy opens in October and assigns A-02
6) Event log ordering is stable and replayable

### A3.1 Minimal Event Log (ordered)
- CandidateRevealed (Jan × 7)
- OfferSubmitted (Feb × 3)
- CandidateSigned (Feb)
- CandidateSigned (Mar)
- EraBandShifted (Apr medical_supply)
- CandidateSigned (May)
- CandidateSigned (Jun foreign)
- CandidateWithdrawn (Jul × 2)
- CandidateRevealed (Aug STAR-01)
- OfferSubmitted (Aug × many)
- CandidateSigned (Aug)
- CandidateSigned (Sep)
- KabuVacancyOpened (Oct)
- CandidateRevealed (Oct × 3)
- KabuAssigned (Oct)
- StaffPoached (Nov)

---

## A4. Cross-System Interaction Summary (What consumes these events)

| Event | Pools | Beya | AI | Economy | Governance | Narrative |
|---|---|---|---|---|---|---|
| CandidateRevealed | update lists | optional | interest calc | none | none | rumor/headline |
| OfferSubmitted | lock talks | none | strategy | none | none | optional |
| CandidateSigned | promote person | roster | update plans | salary sink | eligibility | headline/journal |
| StaffPoached | move staff | staff gap | rivalry shift | wage pressure | none | scandal potential |
| EraBandShifted | adjust supply | warnings | risk posture | inflation | tolerance | season tone |
| KabuVacancyOpened | build candidates | none | lobbying | none | pipeline | headline |
| KabuAssigned | remove candidates | stable continuity | long-term plan | none | log | history entry |

---

END APPENDIX A
