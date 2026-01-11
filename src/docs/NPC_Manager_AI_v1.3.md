# Stable Lords — NPC Manager AI System v1.3  
## Ultimate Definitive Canon: Meta Drift, Succession, Rivalries, Governance Pressure & Deterministic Institutional Behavior

Date: 2026-01-10  
Status: **ULTIMATE DEFINITIVE CANON — FULL DETAIL, IMPLEMENTATION-GRADE**  
Supersedes:
- NPC Beya Manager AI System v1.0  
- NPC Beya Manager AI System v1.1 (Meta Drift, Adaptation, Succession)  
- NPC Manager AI System v1.2 (Rivalries Integrated)

This document consolidates **all features and design ideals** from v1.0–v1.2 into a single authoritative contract.  
Nothing is high level. Everything that must be deterministic is explicit.

---

## 1) System Mandate

NPC managers (oyakata AIs) are **institutional guardians**.

They:
- make roster and finance decisions
- react to perceived meta drift (imperfectly)
- manage foreign/dual-citizen policy under constraints
- navigate scandals, media scrutiny, and governance pressure
- plan succession and preserve stable identity across generations
- internalize rivalries (rikishi, oyakata, stable) without cheating

NPC managers are:
- rational but biased
- strategic but emotional
- deterministic, not optimal

> The AI does not try to win every bout.  
> It tries not to be erased.

---

## 2) Hard Constraints (Binding)

### 2.1 No Cheating / Information Fairness
NPC AI:
- does **not** see hidden stats
- does **not** see “true” opponent traits beyond scouting visibility rules
- does **not** receive outcome buffs

Advantage comes from:
- continuity (long-term memory)
- institutional planning
- deterministic bias, not omniscience

### 2.2 Determinism
Given identical:
- world seed
- match outcomes
- player actions
- information visibility state

NPC decisions are identical.

No hidden dice. No randomness.

### 2.3 Same Rules as Player
NPC managers obey:
- roster limits
- foreign wrestler limits (1-slot rule, dual citizenship exception)
- facility and budget constraints
- governance sanctions, restrictions, and forced actions

---

## 3) Core Objects & Data Contracts

### 3.1 Manager Entity
Each AI-run beya has exactly one active Manager at a time.

```ts
Manager {
  managerId: string
  beyaId: string
  name: string
  origin: "ex_rikishi" | "external" | "caretaker"
  archetype: ManagerArchetype
  traits: ManagerTraits           // immutable 0..1
  quirks: ManagerQuirk[]          // 1–2, immutable
  tenure: TenureRecord
  legacy: LegacyModifier          // produced on exit
  rivalrySensitivity: number      // immutable 0..1
}
```

### 3.2 Traits (Immutable)
```ts
ManagerTraits {
  // Strategic
  RiskTolerance: number
  Patience: number
  PipelineBias: number           // many prospects vs few
  StarBias: number               // concentrate resources
  RecoveryBias: number
  IdentityRigidity: number
  FinanceDiscipline: number
  FacilityAmbition: number

  // Talent evaluation
  ScoutingConfidence: number
  UpsideChasing: number
  VarianceAversion: number
  Loyalty: number

  // Foreign policy
  ForeignSlotAggression: number
  DualCitizenPreference: number

  // Governance & ethics posture
  GovernanceDeference: number
  WelfareSensitivity: number
}
```

### 3.3 Tenure Record
```ts
TenureRecord {
  startedAtTick: TickID
  bashoServed: number
  championships: number
  sekitoriProduced: number
  insolvencyEvents: number
  majorScandals: number
  forcedMergers: number
}
```

### 3.4 Perception Snapshot (Non-Cheating Interface)
Managers act on perceived reality:

```ts
PerceptionSnapshot {
  metaNarratives: MetaNarrativeTag[]     // "pushers everywhere", etc.
  stableHealth: "thriving"|"stable"|"fragile"|"critical"
  injuryMood: "contained"|"worrying"|"spiraling"
  financeMood: "flush"|"tight"|"danger"
  rivalryStates: RivalryPerception[]
  governancePressure: "none"|"watch"|"active"|"crisis"
  mediaHeat: "low"|"medium"|"high"|"inferno"
}
```

NPCs never read raw numeric global meta metrics; they receive narrative tags derived from them.

---

## 4) Canonical Archetypes (Profiles)

Archetypes define target ranges and baseline behavior. Trait values are seeded around archetype anchors.

### 4.1 Talent Factory
- Roster target: 18–25
- PipelineBias high, StarBias low
- Medium patience, medium discipline
- Builds eras through volume and continuity

### 4.2 Star Chaser
- Roster target: 10–14
- StarBias high, patience low
- Higher foreign-slot aggression
- Peaks hard, collapses hard

### 4.3 Survivor
- Roster target: 10–16
- FinanceDiscipline high, RiskTolerance low
- Patience high
- Rarely collapses; rarely dominates

### 4.4 Gambler
- Roster target: 14–20
- RiskTolerance extreme, FinanceDiscipline low
- Fast meta reaction, high volatility
- Boom-or-bust narrative engine

### 4.5 Traditionalist
- Roster target: 12–18
- IdentityRigidity high
- Slow adaptation, prefers continuity
- Defines eras or stagnates

---

## 5) Quirks (Individual Flavor)

Each manager has 1–2 deterministic quirks that slightly bias traits.

Examples:
- Injury Paranoid (+RecoveryBias)
- Prospect Hoarder (+PipelineBias)
- Foreign Talent Believer (+ForeignSlotAggression)
- Facility Maximalist (+FacilityAmbition, −FinanceDiscipline)
- Contrarian (counter-meta bias)
- “Old School Discipline” (+IdentityRigidity, +GovernanceDeference)

Quirks never override constraints; they shift weighting.

---

## 6) Meta Drift System (World-Level Inputs)

### 6.1 What the World Tracks
Computed each basho from top divisions:

- styleShare (oshi / yotsu / hybrid distribution)
- kimariteClassShare (push, throw, slap-pull, trip, rear)
- pressureIndex (short bouts + shove prevalence)
- gripIndex (belt dominance)
- injuryIndex (injuries per 100 bouts)

### 6.2 Drift Detection
Two windows:
- Short: last 2 basho
- Long: last 6 basho

Drift vector:
```
drift = shortAvg − longAvg
```

Only drift above threshold becomes actionable signals.

---

## 7) Manager Interpretation of Meta (Non-Omniscient)

Managers do not see raw metrics; they get narrative tags:

Examples:
- “Pushers are everywhere”
- “Belt battles decide everything”
- “Injuries are climbing league-wide”
- “Slap-downs are punishing overextensions”

Perception is filtered by:
- ScoutingConfidence (confidence in conclusions)
- Patience (tolerance for noise)
- IdentityRigidity (resistance to change)
- Quirks (Contrarian, etc.)
- Rivalry pressure (see §12)

---

## 8) Reaction Lag & Confirmation Rules

### 8.1 Minimum Delay by Archetype (Canonical)
| Profile | Minimum Delay |
|---|---|
| Gambler | 1–2 basho |
| Star Chaser | 1–3 basho |
| Talent Factory | 3–6 basho |
| Survivor | 4–6 basho |
| Traditionalist | 4–8 basho |

### 8.2 Confirmation Gate
Before committing to adaptation:
- drift magnitude must exceed threshold
- AND local results must confirm trend

Exceptions:
- Gambler may act on short-window noise
- Traditionalist requires long-window confirmation

---

## 9) Adaptation Levers (Non-Training)

Managers adapt via structural decisions (training is handled elsewhere).

Available levers:
1. Recruitment bias (physique, style, temperament)
2. Roster size contraction/expansion
3. Facility investment priority (medical, training halls, scouting)
4. Foreign-slot usage strategy
5. Focus slot allocation requests (interface to Training system)
6. Release/retention policy (loyalty vs churn)

---

## 10) Adaptation Tables (Canonical)

### 10.1 Pressure / Oshi Meta ↑
| Profile | Typical Response |
|---|---|
| Star Chaser | Recruit power/speed; chase immediate push stars |
| Talent Factory | Shift intake heavier; raise physical baseline |
| Survivor | Minimal change; stability-first |
| Traditionalist | Counter-meta throws / belt tricks |
| Gambler | Extreme commitment to meta or extreme counter |

### 10.2 Grip / Yotsu Meta ↑
| Profile | Typical Response |
|---|---|
| Traditionalist | Advantage; reinforce identity |
| Talent Factory | Technique-heavy intake; slow compounding |
| Star Chaser | Pay for elite belt technicians |
| Gambler | Hunt rare specialists |

### 10.3 Injury Meta ↑
| Profile | Typical Response |
|---|---|
| Survivor | Medical investment; reduce risk |
| Talent Factory | Recovery systems and pipeline redundancy |
| Star Chaser | Risks collapse by overusing stars |
| Gambler | Doubles down or implodes |

---

## 11) Counter-Meta Behavior

If:
- one style exceeds 55% prevalence
- AND manager has high IdentityRigidity or Contrarian quirk

Then manager may pursue counter-meta identity:
- recruits built to punish dominant style
- slower payoff, but era-defining if correct

Counter-meta behavior is delayed and risky by design.

---

## 12) Rivalry System Integration (Three Layers)

Rivalries exist concurrently:

1) Rikishi ↔ Rikishi (micro)
2) Oyakata ↔ Oyakata (strategic/political)
3) Stable ↔ Stable (institutional, inheritable)

### 12.1 Rivalry Perception (No Numbers)
NPCs perceive:
- state: recognized / heated / bitter / defining
- dominant side (if any)
- recent trend: cooling / escalating

### 12.2 Rivalry Effects on Decisions
Rivalry does not unlock options. It distorts timing and weighting.

#### Recruitment Bias Under Rivalry
When rivalry ≥ Heated:
- overweight recruits that counter rival styles
- accept higher variance prospects
- foreign-slot choices skew toward rivalry counters

#### Training & Development Bias Under Rivalry (Interface Only)
- request narrower focus allocations
- tolerate higher welfare risk (profile-dependent)

#### Economic Risk Under Rivalry
- accept lower runway thresholds
- delay austerity measures
- more likely to pursue supporter loans / benefactors

### 12.3 Rivalry × Meta Drift
- rival success is overweighted
- losses to rivals trigger faster adaptation
- non-rival trends discounted

This is canonical and explains misreads.

---

## 13) Foreign Wrestler Limits & Dual Citizenship (AI Rules)

### 13.1 Constraint
- One foreign wrestler slot per stable (realistic mimic)
- Dual citizens do not consume slot
- AI must obey slot at all times

### 13.2 Policy Drivers
Decision weighting:
- ForeignSlotAggression
- DualCitizenPreference
- Facilities readiness
- Cash runway
- Rivalry pressure

### 13.3 Sunk-Cost Bias (Canonical)
AI is reluctant to release foreign-slot wrestlers due to:
- prestige investment
- narrative identity
- opportunity cost of re-opening slot

This can create “foreign-slot deadlock” failure modes.

---

## 14) Weekly Decision Loop (Deterministic)

Each interim week:

1. Update PerceptionSnapshot (from visible information)
2. Compute solvency mood (flush/tight/danger) from budget signals
3. Check injury mood (contained/worrying/spiraling)
4. Evaluate roster vs target range (archetype)
5. Apply recruitment and retention rules
6. Decide investment posture (facility vs austerity)
7. Decide foreign-slot actions (if applicable)
8. If crisis: choose among deterministic rescue options (supporters/loans/merge pressure)
9. Emit decision logs

---

## 15) Failure Modes (By Design)

- Overreaction to noise (Gambler, Star Chaser)
- Stagnation under changing meta (Traditionalist)
- Pipeline collapse (Star Chaser neglecting depth)
- Foreign-slot deadlock
- Financial ruin via delayed austerity
- Welfare backlash under rivalry pressure
- Governance sanctions escalation after repeated warnings

Failure is narrative texture, not a bug.

---

## 16) Succession & Manager Replacement

### 16.1 Replacement Triggers
- prolonged underperformance vs expectation band
- insolvency events exceeding tolerance
- leadership age / retirement
- governance intervention
- catastrophic scandal

### 16.2 Candidate Sources
1. Internal Ex-Rikishi
2. External Appointment
3. Caretaker Manager (temporary)

### 16.3 Ex-Rikishi Eligibility
- sufficient career prestige
- no major conduct flags
- meets credential constraints (governance hook)

Trait inheritance from career:
- long career → higher Patience
- injury-prone → higher RecoveryBias
- star success → higher StarBias
- journeyman → higher PipelineBias
- foreign career → higher DualCitizenPreference

### 16.4 Legacy Modifiers
Departing managers leave a legacy that influences successors:
- lingering identity rigidity
- staff loyalty inertia
- cultural momentum

Legacy decays over 2–4 basho.

---

## 17) Governance, Scandal & Media Pressure Integration

### 17.1 Governance Pressure
Managers perceive governance pressure states:
- none / watch / active / crisis

High pressure increases:
- caution (high GovernanceDeference)
- desperation (low GovernanceDeference + high RivalrySensitivity)

### 17.2 Scandal Interaction (Behavioral)
Under scandal:
- recruitment slows
- kōenkai stability threatened
- risk posture changes (discipline vs panic)
- merger acceptance shifts (rivalry-dependent)

### 17.3 Sanctions & Restrictions
Managers must obey restrictions (recruitment bans, facility locks, forced austerity).
They respond by:
- rebalancing roster
- hoarding safe prospects
- shifting to low-visibility strategies

---

## 18) Player-Facing Readability (Numbers Hidden)

Players should infer:
- “They always overreact.”
- “They never change.”
- “They’re obsessed with that rival.”
- “New manager, new philosophy.”

UI should show:
- archetype label (optional via scouting)
- qualitative moods (tight/danger)
- visible decisions (new recruit focus, austerity stance)
- rivalry state labels

UI must not show:
- trait numbers
- hidden drift metrics
- internal weights

---

## 19) Logging & Auditability (QA Requirement)

Every decision emits:
- tickId
- managerId
- beyaId
- actionType
- inputs (qualitative tags only)
- outcome

This supports determinism debugging.

---

## 20) Canon One-Liners

- “Rivalries do not change what is possible. They change what is attempted.”
- “NPC managers inherit the meta, misread it, and pass it on.”
- “Continuity is their advantage — and their curse.”

---

**End of NPC Manager AI System v1.3**
