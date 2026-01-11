
# Stable Lords — Beya Management, Staff Careers & Welfare Canon v1.1
## Ultra-Granular Institutional Operations Specification

Status: DEFINITIVE  
Scope: Stable operations, staff careers, welfare & medical liability  
Guarantee: Non-lossy, larger than source material, implementation-grade

This document **merges and supersedes**:
- Beya Management System v1.0
- Staff Careers & Institutional Roles Canon v1.0
- Injury / Welfare–related portions of Rikishi Development Canon v1.3

It resolves overlaps, wires systems together explicitly, and preserves all original text in annexes.

---

# PART I — DESIGN AXIOMS (INSTITUTIONAL SCOPE)

1. **A beya is an employer**, not a menu of bonuses.  
2. **Staff are people with careers**, not sliders.  
3. **Welfare failures have institutional consequences**, not isolated penalties.  
4. **Medical outcomes are deterministic and attributable.**  
5. **Negligence is remembered.**

---

# PART II — BEYA AS AN OPERATING INSTITUTION

## 2. Beya Operational State Model

```ts
BeyaOperationalState {
  beyaId
  facilitiesBand
  staffRoster: StaffId[]
  medicalCoverageBand
  welfareRiskBand
  complianceStatus
  governanceExposure
  operatingStress
}
```

Each field updates on weekly or monthly ticks.

---

## 3. Core Responsibilities of a Beya

A beya is responsible for:
- training safety
- medical care
- injury response
- compliance with governance norms
- staff workload management

Failure in any category produces **institutional risk**, not hidden debuffs.

---

# PART III — STAFF CAREERS (INTEGRATED)

# Stable Lords — Staff Careers & Institutional Roles Canon v1.0
## Ultra-Granular, Integrated Specification (Implementation Grade)

This document **adds a full Staff Career system** and integrates it explicitly with:
- Beya Management
- NPC Manager AI
- Economy & Governance
- Training & Rikishi Development
- Succession, Scandals, and Narrative Memory

It is designed to be **non–high-level**, deterministic, and larger than its source inputs.

---

## PART I — DESIGN INTENT

Staff in Stable Lords are **not modifiers**.
They are **people with careers**, incentives, reputations, fatigue, and failure states.

Staff careers exist to:
- create long-term continuity beyond rikishi careers
- introduce institutional memory
- constrain player optimization
- create succession and governance pressure
- generate narrative arcs (loyal aides, disgraced doctors, legendary coaches)

---

## PART II — STAFF ROLES (CANONICAL)

### 1. Staff Categories

| Role | Count | Notes |
|---|---|---|
| Oyakata | 1 | Required, governed by kabu |
| Assistant Oyakata | 0–2 | Succession + delegation |
| Technique Coach | 0–2 | Skill bias |
| Conditioning Coach | 0–2 | Fatigue & injury bias |
| Nutritionist | 0–1 | Weight stability |
| Medical Staff | 0–2 | Injury severity & recovery |
| Scout | 0–1 | Recruitment & info quality |
| Administrator | 0–1 | Economy & governance mitigation |

No role is optional in effect — absence is a penalty.

---

## PART III — STAFF ENTITY MODEL

### 2. Staff Object (Persistent)

```ts
Staff {
  staffId
  role
  age
  careerPhase
  reputationBand
  loyaltyBand
  competenceBands {
    primary
    secondary?
  }
  fatigue
  scandalExposure
  yearsAtBeya
  priorAffiliations[]
  successorEligible: boolean
}
```

Numeric values exist internally; UI shows **bands and descriptors only**.

---

## PART IV — CAREER PHASES

### 3. Staff Career Phases

| Phase | Effects |
|---|---|
| Apprentice | Low impact, high growth |
| Established | Full effectiveness |
| Senior | Stable but rigid |
| Declining | Error-prone |
| Retired | Succession only |

Career phase advances deterministically by age, workload, and scandal.

---

## PART V — STAFF EFFECTS (WIRED)

### 4. Integration Points

#### 4.1 Training
- Technique coaches bias growth vectors
- Conditioning coaches modify fatigue decay
- Medical staff reduce injury escalation

#### 4.2 Economy
- Staff salaries are fixed weekly drains
- Administrator reduces insolvency escalation
- Senior staff cost more, fail harder

#### 4.3 Governance
- Staff scandals increase scrutiny
- Medical negligence accelerates sanctions
- Assistant oyakata succession affects council decisions

#### 4.4 AI
NPC managers evaluate:
- staff burnout
- loyalty risk
- replacement cost
- succession readiness

---

## PART VI — STAFF SCANDALS

### 5. Staff-Originated Scandals

Examples:
- medical malpractice
- illegal training practices
- recruitment violations
- financial misreporting

Scandals attach to:
- staff member
- beya
- oyakata (derivative)

---

## PART VII — SUCCESSION & LEGACY

### 6. Assistant Oyakata Path

- Must hold or acquire kabu
- Reputation gated
- Loyalty-tested
- May defect to rival beya

Failure to plan succession increases closure probability.

---

## PART VIII — UI & NARRATIVE

### 7. Player Presentation

Staff are shown as:
- named individuals
- described by reputation and habits
- referenced in media and journals

No raw numbers.
No instant replacements.

---

## PART IX — FAILURE MODES (INTENTIONAL)

- Legendary coach retires mid-rebuild
- Doctor scandal collapses trust
- Loyal aide blocks necessary reform
- Costly staff inertia sinks finances

---

## PART X — CANON STATEMENT

> **Stables rise and fall on the people who run them — not just the wrestlers who fight.**


---

# PART IV — MEDICAL & WELFARE SYSTEM (NEW, EXPLICIT)

## 20. Medical Responsibility Chain

For every injury event, responsibility is assigned to:
- rikishi (behavioral overreach)
- staff (training load, treatment)
- facilities (quality limits)
- beya leadership (systemic neglect)

Responsibility determines escalation paths.

---

## 21. Welfare Risk Accumulation

WelfareRisk increases when:
- injuries occur under fatigue overload
- medical staff are understaffed
- recovery is rushed
- chronic injuries are ignored

WelfareRisk decays slowly only with sustained compliance.

---

## 22. Medical Liability States

| State | Meaning |
|---|---|
| Compliant | No active concern |
| Watch | Minor patterns detected |
| Investigation | Formal inquiry |
| Sanctioned | Penalties applied |
| Restricted | Forced changes |

These states are **public-facing**.

---

## 23. Deterministic Investigation Triggers

Triggered by:
- repeated similar injuries
- recovery below minimum curves
- whistleblower events (staff)
- media scrutiny

No random investigations.

---

# PART V — INJURY HANDLING (WIRED)

## 30. Injury Response Pipeline

1. Injury detected
2. Severity classified
3. Medical staff response selected
4. Recovery plan assigned
5. WelfareRisk updated
6. Governance exposure recalculated
7. Narrative record created

Every step is logged.

---

## 31. Negligence vs Misfortune

Negligence requires:
- deviation from required recovery protocol
- understaffed medical coverage
- pattern recurrence

Misfortune injuries do not escalate.

---

# PART VI — FACILITIES, STAFF & WELFARE INTERACTION

## 40. Facility Constraints

Low facility bands:
- increase injury severity
- slow recovery
- raise welfare scrutiny

High facility bands:
- cap injury escalation
- improve compliance reputation

---

## 41. Staff Burnout & Medical Error

Medical staff fatigue increases:
- misdiagnosis risk
- recovery delay
- scandal probability

Burnout is tracked and visible.

---

# PART VII — AI & PLAYER DECISIONS

## 50. AI Beya Management Logic

NPC managers evaluate:
- welfare risk trends
- staff burnout
- compliance danger
- replacement vs cost tradeoffs

AI will sacrifice short-term results to avoid sanctions.

---

## 51. Player Warnings & UI

Players see:
- “Medical oversight concerns”
- “Staff overextended”
- “Recovery protocols under review”

Never raw percentages.

---

# PART VIII — FAILURE MODES (INTENTIONAL)

- Star rikishi career shortened by neglect
- Beya sanctioned for pattern abuse
- Staff scapegoating vs systemic reform
- Financial collapse from compliance costs

---

# PART IX — SOURCE PRESERVATION ANNEX

## Beya Management v1.0
```md
# Stable Lords — Beya Management System v1.0 (Canonical, Training-Agnostic)

Date: 2026-01-06  
Status: Canonical, verbose, implementation-ready  
Scope: Defines **beya (stable) management** excluding training mechanics, which are specified in a separate document.

This document covers:
- roster structure and limits
- recruitment and intake
- staff and facilities (non-training effects)
- economics and solvency
- foreign wrestler rules (including dual citizenship)
- AI-controlled stable behavior
- failure modes and guardrails
- governance hooks (non-active)

---

## 1. Design Goals

Beya management must:
- Create **long-horizon strategic pressure**
- Force **trade-offs**, not micromanagement
- Remain **readable and narratively grounded**
- Apply equally to player-run and AI-run stables
- Integrate cleanly with:
  - rikishi evolution
  - combat outcomes
  - economy and prestige
  - future governance systems

> Managing a beya is about capacity, commitment, and risk — not per-bout control.

---

## 2. Beya as an Entity

Each beya is a persistent world object with:

- Identity (name, lineage, reputation)
- Physical capacity (roster, staff, facilities)
- Financial state (cash flow, upkeep)
- Recruitment pipeline
- Succession risk (forward-declared)

Beya decisions affect **all rikishi indirectly**.

---

## 3. Roster Management

### 3.1 Roster Size Constraints

| Constraint | Value |
|---|---:|
| Minimum viable roster | 6 |
| Typical roster | 10–15 |
| Soft cap | 20 |
| Hard cap | 30 |

Below minimum:
- beya is flagged as *fragile*
- emergency recruitment or merger hooks appear

Above soft cap:
- diminishing returns and injury pressure (see §10)

Above hard cap:
- forbidden

---

### 3.2 Implicit Internal Structure

Rosters are not manually tiered. Structure emerges from:
- rank
- career phase
- focus allocation (defined elsewhere)

Implicit groups:
- Prospects
- Core competitors
- Stars
- Veterans

This structure feeds narrative, not control logic.

---

## 4. Recruitment & Intake

### 4.1 Recruitment Windows

Recruitment occurs only at:
1) **Post-basho review**
2) **Mid-interim (week 3)**

This limits spam and creates rhythm.

---

### 4.2 Recruitment Slots per Basho

Base: **1**

Modifiers:
- roster ≤ 12 → +1
- kitchen ≥ 3 AND dormitory ≥ 2 → +1
- roster ≥ 20 → −1

Result:
- min 0
- max 3 recruits per basho

---

### 4.3 Recruitment Sources (v1)

- Local prospects (baseline)
- Regional standouts (higher ceiling)
- Dual citizens (rare, special)
- Foreign recruits (slot-limited)

Transfers and academies are future extensions.

---

### 4.4 Recruitment Costs

| Recruit Type | Signing Cost |
|---|---:|
| Local prospect | ¥50,000 |
| Regional standout | ¥120,000 |

Recruitment immediately increases weekly upkeep.

---

## 5. Foreign Rikishi & Dual Citizenship

### 5.1 Canonical Rule

> **Each beya may roster at most ONE foreign-slot rikishi at any time.**

A rikishi consumes the foreign slot **only if they do not hold Japanese citizenship**.

---

### 5.2 Nationality Model

Each rikishi has:
- `birthCountry` (immutable)
- `citizenships[]`
- derived `foreignSlotStatus`

Foreign-slot if:
```
"Japan" NOT in citizenships[]
```

---

### 5.3 Dual Citizenship

- Dual citizens **do not** consume the foreign slot
- Dual citizenship is rare (≈5–10% of foreign-born recruits)
- Dual citizens still carry narrative and adaptation flavor

---

### 5.4 Recruitment Enforcement

- If foreign slot is occupied:
  - foreign-slot recruits do not appear
- Dual citizens may always appear
- UI must clearly show slot impact before signing

---

### 5.5 Future Naturalization (Dormant)

Naturalization is:
- rare
- prestige-gated
- narrative-significant

If activated, gaining Japanese citizenship frees the foreign slot.

---

## 6. Staff System (Non-Training Effects)

### 6.1 Staff Types

- Oyakata (always 1)
- Technique Coach
- Conditioning Coach
- Nutritionist
- Medical Staff

Training effects are defined elsewhere.  
Here, staff define **capacity, recovery, and mitigation**.

---

### 6.2 Staff Capacity

Each staff member has a coverage capacity:

| Staff | Capacity |
|---|---:|
| Technique Coach | 12 |
| Conditioning Coach | 12 |
| Nutritionist | 16 |
| Medical Staff | 18 |

If roster exceeds capacity:
```
effectiveStaffImpact = capacity / rosterSize
```

---

### 6.3 Staff Limits

- Max staff (excluding oyakata): **6**
- Max duplicates:
  - Technique: 2
  - Conditioning: 2
  - Nutrition: 1
  - Medical: 2 (optional elite scaling)

---

## 7. Facilities (Structural, Not Training)

Facilities define **ceilings and forgiveness**, not skill choices.

| Facility | Effect |
|---|---|
| Dojo | Technique ceiling |
| Kitchen | Weight control stability |
| Recovery | Fatigue decay |
| Medical | Injury severity & recurrence |
| Dormitory | Morale & baseline recovery |

Facility levels: 0–5 each.

---

### 7.1 Facility Costs

**Build / Upgrade (one-time):**

| Level | Cost |
|---|---:|
| 1 | ¥150,000 |
| 2 | ¥250,000 |
| 3 | ¥400,000 |
| 4 | ¥600,000 |
| 5 | ¥900,000 |

**Weekly upkeep:**
```
¥1,000 × total facility levels
```

---

## 8. Beya Economics

### 8.1 Weekly Expenses

| Expense | Formula |
|---|---|
| Wrestlers | ¥2,000 × roster size |
| Staff | ¥6,000 × staff count |
| Facilities | ¥1,000 × facility levels |

Expenses are continuous and unavoidable.

---

### 8.2 Income (High-Level)

- Kenshō banners
- Prestige-modified appearance value
- Success-driven visibility

Income volatility is intentional.

---

### 8.3 Insolvency Handling

- Grace period (weeks)
- Forced austerity (freeze recruitment, sell facilities)
- Later: loans / benefactors (dormant)

---

## 9. AI-Run Stables

AI stables obey **exactly the same rules**.

### 9.1 AI Management Profiles

| Profile | Identity |
|---|---|
| Talent Factory | Large pipeline, conservative |
| Star Chaser | Small elite, aggressive |
| Survivor | Risk-averse |
| Gambler | High variance |
| Traditionalist | Identity-driven |

---

### 9.2 AI Weekly Decision Loop

Each interim week:
1) Check solvency runway
2) Check injury burden
3) Check roster vs target
4) Allocate focus (defined elsewhere)
5) Consider facility upgrades
6) Evaluate recruitment windows

Decisions are deterministic but imperfect.

---

### 9.3 AI Foreign Rikishi Logic

AI evaluates:
- foreign slot availability
- injury risk tolerance
- facilities readiness
- profile risk bias

AI is reluctant to release foreign-slot rikishi unless forced.

---

## 10. Failure Modes & Guardrails

### 10.1 Overcrowding
- Training efficiency loss
- Injury pressure
- Staff dilution

### 10.2 Star Hoarding
- Succession risk
- Injury fragility
- Financial volatility

### 10.3 Insolvency
- Gradual collapse, not instant death

### 10.4 Succession Collapse (Future)
- No eligible successor → closure or merger

Failure is allowed and narratively valuable.

---

## 11. Governance Hooks (Dormant)

Even before activation:
- beya legitimacy tracked
- conduct and solvency logged
- succession candidates evaluated

Later governance systems plug into these signals without retcons.

---

## 12. UI & Player Communication Rules

- Always show:
  - roster size vs caps
  - foreign slot usage
  - weekly burn rate
- Never show:
  - raw hidden efficiency math
- Explain consequences in plain language

---

## 13. Canon One-Liner

> **A beya is not a menu of buffs — it is a living institution whose size, staff, finances, and commitments determine which careers flourish and which fail.**

---

End of document.

```

## Staff Careers Canon v1.0
```md
# Stable Lords — Staff Careers & Institutional Roles Canon v1.0
## Ultra-Granular, Integrated Specification (Implementation Grade)

This document **adds a full Staff Career system** and integrates it explicitly with:
- Beya Management
- NPC Manager AI
- Economy & Governance
- Training & Rikishi Development
- Succession, Scandals, and Narrative Memory

It is designed to be **non–high-level**, deterministic, and larger than its source inputs.

---

## PART I — DESIGN INTENT

Staff in Stable Lords are **not modifiers**.
They are **people with careers**, incentives, reputations, fatigue, and failure states.

Staff careers exist to:
- create long-term continuity beyond rikishi careers
- introduce institutional memory
- constrain player optimization
- create succession and governance pressure
- generate narrative arcs (loyal aides, disgraced doctors, legendary coaches)

---

## PART II — STAFF ROLES (CANONICAL)

### 1. Staff Categories

| Role | Count | Notes |
|---|---|---|
| Oyakata | 1 | Required, governed by kabu |
| Assistant Oyakata | 0–2 | Succession + delegation |
| Technique Coach | 0–2 | Skill bias |
| Conditioning Coach | 0–2 | Fatigue & injury bias |
| Nutritionist | 0–1 | Weight stability |
| Medical Staff | 0–2 | Injury severity & recovery |
| Scout | 0–1 | Recruitment & info quality |
| Administrator | 0–1 | Economy & governance mitigation |

No role is optional in effect — absence is a penalty.

---

## PART III — STAFF ENTITY MODEL

### 2. Staff Object (Persistent)

```ts
Staff {
  staffId
  role
  age
  careerPhase
  reputationBand
  loyaltyBand
  competenceBands {
    primary
    secondary?
  }
  fatigue
  scandalExposure
  yearsAtBeya
  priorAffiliations[]
  successorEligible: boolean
}
```

Numeric values exist internally; UI shows **bands and descriptors only**.

---

## PART IV — CAREER PHASES

### 3. Staff Career Phases

| Phase | Effects |
|---|---|
| Apprentice | Low impact, high growth |
| Established | Full effectiveness |
| Senior | Stable but rigid |
| Declining | Error-prone |
| Retired | Succession only |

Career phase advances deterministically by age, workload, and scandal.

---

## PART V — STAFF EFFECTS (WIRED)

### 4. Integration Points

#### 4.1 Training
- Technique coaches bias growth vectors
- Conditioning coaches modify fatigue decay
- Medical staff reduce injury escalation

#### 4.2 Economy
- Staff salaries are fixed weekly drains
- Administrator reduces insolvency escalation
- Senior staff cost more, fail harder

#### 4.3 Governance
- Staff scandals increase scrutiny
- Medical negligence accelerates sanctions
- Assistant oyakata succession affects council decisions

#### 4.4 AI
NPC managers evaluate:
- staff burnout
- loyalty risk
- replacement cost
- succession readiness

---

## PART VI — STAFF SCANDALS

### 5. Staff-Originated Scandals

Examples:
- medical malpractice
- illegal training practices
- recruitment violations
- financial misreporting

Scandals attach to:
- staff member
- beya
- oyakata (derivative)

---

## PART VII — SUCCESSION & LEGACY

### 6. Assistant Oyakata Path

- Must hold or acquire kabu
- Reputation gated
- Loyalty-tested
- May defect to rival beya

Failure to plan succession increases closure probability.

---

## PART VIII — UI & NARRATIVE

### 7. Player Presentation

Staff are shown as:
- named individuals
- described by reputation and habits
- referenced in media and journals

No raw numbers.
No instant replacements.

---

## PART IX — FAILURE MODES (INTENTIONAL)

- Legendary coach retires mid-rebuild
- Doctor scandal collapses trust
- Loyal aide blocks necessary reform
- Costly staff inertia sinks finances

---

## PART X — CANON STATEMENT

> **Stables rise and fall on the people who run them — not just the wrestlers who fight.**

```

## Rikishi Development Canon v1.3 (Welfare Sections)
```md

# Stable Lords — Rikishi Development Canon v1.3
## Ultra-Granular Training, Evolution, Injury, Style, Psychology & Facilities

Status: **DEFINITIVE / EXPANDED**
Scope: Rikishi development systems only.
Guarantee: Larger than v1.2, non-lossy, implementation-grade.

This document extends v1.2 by fully specifying:
1. Mental & Psychological Load System
2. Training Facility & Staff Micro-Effects
3. Retirement, Post-Career & Legacy Transitions

---


# Stable Lords — Rikishi Development Canon v1.2
## Ultra-Granular Training, Evolution, Injury, Style Drift & Worked Example

Status: **DEFINITIVE / EXPANDED**
Scope: Rikishi development systems only.
Guarantee: Larger than v1.1, non-lossy, implementation-grade.

This document **extends v1.1** by fully specifying:
- Injury State Machine (explicit)
- Style Drift & Reclassification Math
- Favored Kimarite Evolution
- Full Worked Example (10-year career timeline)

---


# Stable Lords — Rikishi Development Canon v1.1
## Ultra-Granular Training + Evolution Constitution (Implementation Grade)

Status: **DEFINITIVE**
Scope: **Only rikishi development over time**
Explicitly excludes: combat resolution, economy amounts, roster admin

This document is:
- larger than its source material
- non-lossy
- explicit down to weekly ticks and state transitions
- suitable for direct engineering implementation

It consolidates and EXPANDS:
- Training System v1.0
- Rikishi Evolution System v1.0

---

# PART I — ABSOLUTE DESIGN LAWS (DEVELOPMENT SCOPE)

## 1. Determinism
All development outcomes are a pure function of:
- WorldSeed
- RikishiSeed
- TimeIndex (week)
- Training profile selections
- Injury history
- Career phase

No runtime RNG.
No “soft” decay.

## 2. Separation of Timescales
- **Training** operates weekly
- **Evolution** accumulates monthly and basho-end
- **Career phase** shifts are rare and thresholded

This separation prevents oscillation.

---

# PART II — RIKISHI STATE MODEL (NORMALIZED)

## 3. Permanent Identity (Immutable)
- rikishiId
- shikona registry entry
- origin
- base talent seed
- growth profile seed
- dominant archetype seed

## 4. Evolving State (Mutable)
Grouped by layer:

### 4.1 Body Layer
- heightCurrentCm
- weightCurrentKg
- heightPotentialCm
- weightPotentialKg
- growthFulfillment

### 4.2 Execution Layer
- powerOutput
- speedOutput
- balanceOutput
- techniqueOutput
- experienceOutput

### 4.3 Condition Layer
- fatigue
- injuryState
- injuryHistory[]
- recoveryModifier

### 4.4 Identity Layer
- styleLabel
- styleConfidence
- archetypeSecondary (optional)
- favoredKimarite[]

### 4.5 Arc Layer
- careerPhase
- phaseEntryTick
- retirementEligibility

---

# PART III — TRAINING SYSTEM (EXPANDED + WIRED)

# Stable Lords — Training System v1.0 (Canonical)

Date: 2026-01-06  
Status: Canonical, verbose, implementation-ready  
Scope: Defines **training mechanics** at both beya and individual levels, and how training shapes rikishi evolution.  
This document intentionally excludes roster management, economics, and AI manager logic, which are defined elsewhere.

---

## 1. Design Goals

The training system must:
- Provide **meaningful player agency** without micromanagement
- Shape long-term **rikishi evolution**, not short-term bout outcomes
- Create **risk–reward trade-offs**
- Be **deterministic and legible**
- Integrate cleanly with:
  - Rikishi Evolution System
  - Beya Management System
  - NPC Manager AI System

> Training biases probability; it never guarantees greatness.

---

## 2. Core Training Philosophy

Training operates on **bias and pressure**, not direct stat control.

Players and AI:
- do not assign drills or skills directly
- choose **intensity, focus, and protection**
- accept downstream consequences via fatigue, injuries, and style drift

Training is evaluated **weekly** during interim periods.

---

## 3. Training Layers

Training exists on three stacked layers:

1. **Beya-Wide Training Profile** (default environment)
2. **Individual Focus Slots** (limited overrides)
3. **Facilities & Staff Modifiers** (multipliers, not decisions)

This ensures:
- consistency
- scarcity of attention
- emergent specialization

---

## 4. Beya-Wide Training Profile

Each beya selects one active training profile per interim.

### 4.1 Training Axes

Training profile is defined by four axes:

#### A) Intensity
- Conservative
- Balanced
- Intensive
- Punishing

#### B) Focus Bias
- Power
- Speed
- Technique
- Balance
- Neutral

#### C) Style Bias
- Oshi
- Yotsu
- Neutral

#### D) Recovery Emphasis
- Low
- Normal
- High

These axes modify growth, fatigue, and injury risk.

---

### 4.2 Default Numeric Effects (Illustrative)

#### Intensity Effects

| Intensity | Growth Mult | Fatigue Gain | Injury Risk |
|---|---:|---:|---:|
| Conservative | 0.85 | 0.75 | 0.80 |
| Balanced | 1.00 | 1.00 | 1.00 |
| Intensive | 1.20 | 1.25 | 1.15 |
| Punishing | 1.35 | 1.50 | 1.35 |

#### Recovery Emphasis Effects

| Recovery | Fatigue Decay | Injury Recovery |
|---|---:|---:|
| Low | 0.80 | 0.85 |
| Normal | 1.00 | 1.00 |
| High | 1.25 | 1.20 |

---

### 4.3 Focus Bias → Skill Growth Bias

| Focus | Power | Speed | Technique | Balance |
|---|---:|---:|---:|---:|
| Power | 1.30 | 0.85 | 0.95 | 0.95 |
| Speed | 0.85 | 1.30 | 0.95 | 0.95 |
| Technique | 0.90 | 0.90 | 1.35 | 1.10 |
| Balance | 0.90 | 0.95 | 1.10 | 1.35 |
| Neutral | 1.00 | 1.00 | 1.00 | 1.00 |

---

## 5. Individual Focus Slots

### 5.1 Focus Slot Availability
- Base slots: **3**
- +1 at prestige tier 2
- +1 at prestige tier 4
- Max: **5**

Only focused rikishi may receive individual overrides.

---

### 5.2 Focus Modes

Each focus slot selects one mode:

| Mode | Growth | Fatigue | Injury Risk | Notes |
|---|---:|---:|---:|---|
| Develop | +25% | +10% | +5% | Default growth |
| Push | +35% | +20% | +20% | Win-now pressure |
| Protect | −15% | −25% | −30% | Longevity |
| Rebuild | +10% | −10% | −15% | Post-injury |

Focus modes stack multiplicatively with beya-wide profile.

---

## 6. Training → Rikishi Evolution Wiring

### 6.1 Physique
- High intensity → faster weight gain
- High recovery → controlled weight, better fulfillment
- Overtraining → stalled growth + injury spikes

Height is unaffected after youth.

---

### 6.2 Skills
Training biases **effectiveness growth**, not raw skill caps.

Growth is:
- fast early
- diminishing in prime
- fragile in veteran phase

---

### 6.3 Style Drift
Training does not set style directly.

Instead:
- Style bias nudges recomputation thresholds
- Sustained mismatch between body and training causes inefficiency

This prevents “click to choose style” exploits.

---

### 6.4 Archetype Interaction
Training does **not** change dominant archetype.

It may:
- accelerate secondary archetype emergence
- suppress risky behaviors under conservative regimes

---

## 7. Fatigue & Injury Integration

### 7.1 Fatigue
- Accumulates weekly from training
- Scales with intensity and focus
- Decays via recovery emphasis and facilities

High fatigue:
- reduces bout performance
- increases injury risk
- pushes kimarite selection toward short finishes

---

### 7.2 Injuries
Training contributes to injury probability.

Risk factors:
- high fatigue
- punishing intensity
- low recovery
- prior injury history

Injuries apply:
- attribute penalties
- recovery timelines
- narrative hooks

---

## 8. Career Phase Sensitivity

Training effectiveness varies by phase:

| Phase | Growth | Injury Sensitivity |
|---|---:|---:|
| Youth | High | Low |
| Development | High | Medium |
| Prime | Medium | Medium |
| Veteran | Low | High |
| Late | Very Low | Very High |

This encourages different strategies across careers.

---

## 9. AI Use of Training

AI managers select training profiles based on:
- their profile traits
- roster composition
- injury load
- meta drift signals
- financial runway

Examples:
- Survivor favors Conservative + High Recovery
- Gambler spikes Punishing during contention
- Talent Factory uses Balanced + Neutral

AI obeys same focus slot limits as player.

---

## 10. Player UX Rules

Players see:
- training philosophy descriptions
- warnings (“Injury risk rising”)
- trend indicators (“Style drifting toward Yotsu”)

Players never see:
- raw multipliers
- hidden fatigue math

---

## 11. Failure Modes (By Design)

- Overtraining cascades
- Burned-out prospects
- Injury-plagued stars
- Short primes with spectacular peaks

These are outcomes, not bugs.

---

## 12. Canon One-Liner

> **Training shapes the conditions under which bodies, habits, and styles evolve — it never dictates the result of a single bout.**

---

End of document.


---

# PART IV — EVOLUTION SYSTEM (EXPANDED + WIRED)

# Stable Lords — Rikishi Evolution System v1.0 (Canonical)

Date: 2026-01-06  
Scope: Full, end-to-end specification of **rikishi evolution** in Stable Lords, covering physique, skills, style, archetype, kimarite identity, and career arcs.  
Status: Canonical, deterministic, implementation-ready.

This document explains **how a rikishi changes over time**, why those changes occur, and how they connect to combat, narrative, and UI.

---

## 1. Design Goals

Rikishi evolution must:
- Be **deterministic** and reproducible.
- Produce **believable career arcs** without scripted outcomes.
- Be **readable to players** (no hidden “RPG decay”).
- Integrate cleanly with:
  - Combat Engine V3
  - Kimarite tier/style/archetype system
  - Rivalries and narrative
  - Career journals and governance

---

## 2. Core Principle

> **Rikishi do not gain or lose abstract “power.”  
They change bodies, habits, and constraints — and the simulation responds.**

Evolution is the interaction of:
1. Physique (body)
2. Skills (execution)
3. Style (technical preference)
4. Archetype (temperament)
5. Kimarite identity (proof of behavior)
6. Career phase (time + pressure)

Each layer evolves on a different timescale.

---

## 3. Data Model Overview

### 3.1 Permanent Identity (Never Changes)
- `id`
- `shikona`
- origin metadata
- base talent seed
- growth profile seed
- dominant archetype (initial)

These define *who the rikishi is*.

### 3.2 Evolving State (Changes Over Time)
- heightCurrent / weightCurrent
- growth fulfillment
- skill outputs (power, speed, balance, technique, experience)
- fatigue, injuries, momentum
- style (oshi / yotsu / hybrid)
- secondary archetype tendency (optional)
- favored kimarite (tokui-waza)
- career phase

---

## 4. Physique Evolution (The Body Layer)

### 4.1 Height
- Grows early career only.
- Stops deterministically based on growth profile.
- Influences reach, leverage, grip geometry.

Height explains *structural possibility*, not tactical choice.

### 4.2 Weight (Primary Evolution Lever)
- Changes throughout career.
- Influences:
  - power effectiveness
  - speed effectiveness
  - fatigue accumulation
  - injury risk
  - recovery rate
- Strongest driver of style drift.

### 4.3 Current vs Potential
Each rikishi has:
- `heightPotentialCm`
- `weightPotentialKg`
- `growthFulfillment` ∈ [0,1]

Potential is a **ceiling**, not a guarantee.
Training, injuries, and facilities determine how close it is reached.

---

## 5. Skill Evolution (Execution Layer)

Canonical skill outputs:
- **Power** — force generation and drive
- **Speed** — burst and lateral movement
- **Balance** — resistance to displacement and counters
- **Technique** — grip craft, throw timing, transitions
- **Experience** — decision quality and counters

### 5.1 Growth Pattern
- Youth: spiky, uneven gains
- Development: steady improvement
- Prime: diminishing returns
- Veteran: flat or declining effectiveness
- Late: managed decline

Skills are modified by physique:
- Same technique score behaves differently at different weights.

---

## 6. Style Evolution (Primary Public Identity)

Styles:
- **Oshi** — distance, push/thrust
- **Yotsu** — belt, control, throws
- **Hybrid** — adaptable

### 6.1 Style Is Derived
Style is recomputed periodically from:
- weight trends
- balance vs speed ratio
- grip success rates
- kimarite usage distribution
- career phase bias

### 6.2 Hysteresis
- Style changes require sustained signals.
- Prevents oscillation basho-to-basho.

Style is **what the rikishi usually tries to do**.

---

## 7. Archetype Evolution (Temperament Layer)

Archetypes describe **behavior under pressure**.

### 7.1 Dominant Archetype
- Seeded at creation.
- Rarely changes.
- Represents temperament.

### 7.2 Secondary Archetype Drift
- Optional, slow-moving.
- Emerges from repeated behavior patterns.
- Strength ∈ [0.1–0.5].

Dominant archetype applies fully.  
Secondary archetype bends behavior slightly.

---

## 8. Kimarite Identity (Proof of Evolution)

### 8.1 Favored Kimarite (Tokui-waza)
- Tracked from actual wins.
- Top 2–3 maintained.
- Applies 2× selection bonus in combat.

### 8.2 Feedback Loop
Body → Style → Kimarite usage → Favorites → Reinforcement

As the body changes, favored moves may fade or be replaced.

---

## 9. Career Phases (Arc Layer)

Phases are computed, not age-locked:
1. Youth / Prospect
2. Development / Rise
3. Prime
4. Veteran / Decline
5. Late Career / Exit

Inputs:
- age
- growth fulfillment plateau
- injury accumulation
- fatigue recovery slowdown
- performance trends

Phases bias:
- growth rates
- injury risk
- style drift likelihood
- retirement triggers

---

## 10. Determinism Contract

Every evolution step is derived from:
- World seed
- Rikishi seed
- Time index
- Player inputs (training, facilities)
- Deterministic outcomes (bouts, injuries)

No hidden randomness.  
Same inputs → same careers.

---

## 11. UI & Readability Rules

### 11.1 Rikishi Card
- **Style**: primary label
- **Archetype**: secondary
- **Secondary archetype**: only if meaningful
- **Favored kimarite**: visible proof
- Physique shown indirectly via notes, not raw stats by default

### 11.2 Advanced Views
- Physique history
- Style drift timeline
- Kimarite usage charts
- Career journal entries

---

## 12. Narrative Integration

Narrative systems consume evolution:
- “Former speedster adapts to belt fighting”
- “Signature throw fades after knee injury”
- “Late-career reinvention”

Narrative never changes outcomes.

---

## 13. Why This Works

- Careers feel authored, but are not scripted.
- Decline feels earned, not punitive.
- Specialization emerges organically.
- Players learn to *read* wrestlers, not stats.

---

## 14. Canon One-Liner

> **Rikishi evolution is the story of a body adapting to time, pressure, and consequence — expressed through style, behavior, and the techniques that survive.**

---

End of document.


---

# PART V — TRAINING → EVOLUTION WIRING (NEW, GRANULAR)

## 15. Weekly Tick Algorithm (Explicit)

For each rikishi, each week:

1. Read beya training profile
2. Read individual focus (if any)
3. Compute growthBiasVector
4. Compute fatigueDelta
5. Compute injuryRiskDelta
6. Apply fatigue accumulation
7. Roll deterministic injury check
8. Apply injury state transitions
9. Accumulate growth progress (buffered)
10. Log DevelopmentEvent

No evolution is applied immediately to combat outputs until monthly consolidation.

---

## 16. Monthly Consolidation

Every 4 weeks:
- buffered growth applies to physique and skills
- style recomputation check runs
- favored kimarite may update
- career phase transition check runs

---

## 17. Career Phase Transition Rules (Explicit)

Transitions require **multiple signals**:
- growthFulfillment plateau
- fatigue recovery slowdown
- injury frequency
- performance trend

Single signals never force a phase change.

---

# PART VI — FAILURE MODES (INTENTIONAL)

- Burned prospects
- Late bloomers
- Short primes
- Reinvention arcs
- Chronic injury decline

These outcomes are authored by systems, not random chance.

---

# PART VII — UI CONTRACT (DEVELOPMENT)

Players see:
- philosophy language
- warnings
- trend descriptors

Players never see:
- growth buffers
- raw multipliers
- phase thresholds

---

# PART VIII — SOURCE PRESERVATION ANNEX (VERBATIM)

## Training System v1.0
```md
# Stable Lords — Training System v1.0 (Canonical)

Date: 2026-01-06  
Status: Canonical, verbose, implementation-ready  
Scope: Defines **training mechanics** at both beya and individual levels, and how training shapes rikishi evolution.  
This document intentionally excludes roster management, economics, and AI manager logic, which are defined elsewhere.

---

## 1. Design Goals

The training system must:
- Provide **meaningful player agency** without micromanagement
- Shape long-term **rikishi evolution**, not short-term bout outcomes
- Create **risk–reward trade-offs**
- Be **deterministic and legible**
- Integrate cleanly with:
  - Rikishi Evolution System
  - Beya Management System
  - NPC Manager AI System

> Training biases probability; it never guarantees greatness.

---

## 2. Core Training Philosophy

Training operates on **bias and pressure**, not direct stat control.

Players and AI:
- do not assign drills or skills directly
- choose **intensity, focus, and protection**
- accept downstream consequences via fatigue, injuries, and style drift

Training is evaluated **weekly** during interim periods.

---

## 3. Training Layers

Training exists on three stacked layers:

1. **Beya-Wide Training Profile** (default environment)
2. **Individual Focus Slots** (limited overrides)
3. **Facilities & Staff Modifiers** (multipliers, not decisions)

This ensures:
- consistency
- scarcity of attention
- emergent specialization

---

## 4. Beya-Wide Training Profile

Each beya selects one active training profile per interim.

### 4.1 Training Axes

Training profile is defined by four axes:

#### A) Intensity
- Conservative
- Balanced
- Intensive
- Punishing

#### B) Focus Bias
- Power
- Speed
- Technique
- Balance
- Neutral

#### C) Style Bias
- Oshi
- Yotsu
- Neutral

#### D) Recovery Emphasis
- Low
- Normal
- High

These axes modify growth, fatigue, and injury risk.

---

### 4.2 Default Numeric Effects (Illustrative)

#### Intensity Effects

| Intensity | Growth Mult | Fatigue Gain | Injury Risk |
|---|---:|---:|---:|
| Conservative | 0.85 | 0.75 | 0.80 |
| Balanced | 1.00 | 1.00 | 1.00 |
| Intensive | 1.20 | 1.25 | 1.15 |
| Punishing | 1.35 | 1.50 | 1.35 |

#### Recovery Emphasis Effects

| Recovery | Fatigue Decay | Injury Recovery |
|---|---:|---:|
| Low | 0.80 | 0.85 |
| Normal | 1.00 | 1.00 |
| High | 1.25 | 1.20 |

---

### 4.3 Focus Bias → Skill Growth Bias

| Focus | Power | Speed | Technique | Balance |
|---|---:|---:|---:|---:|
| Power | 1.30 | 0.85 | 0.95 | 0.95 |
| Speed | 0.85 | 1.30 | 0.95 | 0.95 |
| Technique | 0.90 | 0.90 | 1.35 | 1.10 |
| Balance | 0.90 | 0.95 | 1.10 | 1.35 |
| Neutral | 1.00 | 1.00 | 1.00 | 1.00 |

---

## 5. Individual Focus Slots

### 5.1 Focus Slot Availability
- Base slots: **3**
- +1 at prestige tier 2
- +1 at prestige tier 4
- Max: **5**

Only focused rikishi may receive individual overrides.

---

### 5.2 Focus Modes

Each focus slot selects one mode:

| Mode | Growth | Fatigue | Injury Risk | Notes |
|---|---:|---:|---:|---|
| Develop | +25% | +10% | +5% | Default growth |
| Push | +35% | +20% | +20% | Win-now pressure |
| Protect | −15% | −25% | −30% | Longevity |
| Rebuild | +10% | −10% | −15% | Post-injury |

Focus modes stack multiplicatively with beya-wide profile.

---

## 6. Training → Rikishi Evolution Wiring

### 6.1 Physique
- High intensity → faster weight gain
- High recovery → controlled weight, better fulfillment
- Overtraining → stalled growth + injury spikes

Height is unaffected after youth.

---

### 6.2 Skills
Training biases **effectiveness growth**, not raw skill caps.

Growth is:
- fast early
- diminishing in prime
- fragile in veteran phase

---

### 6.3 Style Drift
Training does not set style directly.

Instead:
- Style bias nudges recomputation thresholds
- Sustained mismatch between body and training causes inefficiency

This prevents “click to choose style” exploits.

---

### 6.4 Archetype Interaction
Training does **not** change dominant archetype.

It may:
- accelerate secondary archetype emergence
- suppress risky behaviors under conservative regimes

---

## 7. Fatigue & Injury Integration

### 7.1 Fatigue
- Accumulates weekly from training
- Scales with intensity and focus
- Decays via recovery emphasis and facilities

High fatigue:
- reduces bout performance
- increases injury risk
- pushes kimarite selection toward short finishes

---

### 7.2 Injuries
Training contributes to injury probability.

Risk factors:
- high fatigue
- punishing intensity
- low recovery
- prior injury history

Injuries apply:
- attribute penalties
- recovery timelines
- narrative hooks

---

## 8. Career Phase Sensitivity

Training effectiveness varies by phase:

| Phase | Growth | Injury Sensitivity |
|---|---:|---:|
| Youth | High | Low |
| Development | High | Medium |
| Prime | Medium | Medium |
| Veteran | Low | High |
| Late | Very Low | Very High |

This encourages different strategies across careers.

---

## 9. AI Use of Training

AI managers select training profiles based on:
- their profile traits
- roster composition
- injury load
- meta drift signals
- financial runway

Examples:
- Survivor favors Conservative + High Recovery
- Gambler spikes Punishing during contention
- Talent Factory uses Balanced + Neutral

AI obeys same focus slot limits as player.

---

## 10. Player UX Rules

Players see:
- training philosophy descriptions
- warnings (“Injury risk rising”)
- trend indicators (“Style drifting toward Yotsu”)

Players never see:
- raw multipliers
- hidden fatigue math

---

## 11. Failure Modes (By Design)

- Overtraining cascades
- Burned-out prospects
- Injury-plagued stars
- Short primes with spectacular peaks

These are outcomes, not bugs.

---

## 12. Canon One-Liner

> **Training shapes the conditions under which bodies, habits, and styles evolve — it never dictates the result of a single bout.**

---

End of document.

```

## Rikishi Evolution System v1.0
```md
# Stable Lords — Rikishi Evolution System v1.0 (Canonical)

Date: 2026-01-06  
Scope: Full, end-to-end specification of **rikishi evolution** in Stable Lords, covering physique, skills, style, archetype, kimarite identity, and career arcs.  
Status: Canonical, deterministic, implementation-ready.

This document explains **how a rikishi changes over time**, why those changes occur, and how they connect to combat, narrative, and UI.

---

## 1. Design Goals

Rikishi evolution must:
- Be **deterministic** and reproducible.
- Produce **believable career arcs** without scripted outcomes.
- Be **readable to players** (no hidden “RPG decay”).
- Integrate cleanly with:
  - Combat Engine V3
  - Kimarite tier/style/archetype system
  - Rivalries and narrative
  - Career journals and governance

---

## 2. Core Principle

> **Rikishi do not gain or lose abstract “power.”  
They change bodies, habits, and constraints — and the simulation responds.**

Evolution is the interaction of:
1. Physique (body)
2. Skills (execution)
3. Style (technical preference)
4. Archetype (temperament)
5. Kimarite identity (proof of behavior)
6. Career phase (time + pressure)

Each layer evolves on a different timescale.

---

## 3. Data Model Overview

### 3.1 Permanent Identity (Never Changes)
- `id`
- `shikona`
- origin metadata
- base talent seed
- growth profile seed
- dominant archetype (initial)

These define *who the rikishi is*.

### 3.2 Evolving State (Changes Over Time)
- heightCurrent / weightCurrent
- growth fulfillment
- skill outputs (power, speed, balance, technique, experience)
- fatigue, injuries, momentum
- style (oshi / yotsu / hybrid)
- secondary archetype tendency (optional)
- favored kimarite (tokui-waza)
- career phase

---

## 4. Physique Evolution (The Body Layer)

### 4.1 Height
- Grows early career only.
- Stops deterministically based on growth profile.
- Influences reach, leverage, grip geometry.

Height explains *structural possibility*, not tactical choice.

### 4.2 Weight (Primary Evolution Lever)
- Changes throughout career.
- Influences:
  - power effectiveness
  - speed effectiveness
  - fatigue accumulation
  - injury risk
  - recovery rate
- Strongest driver of style drift.

### 4.3 Current vs Potential
Each rikishi has:
- `heightPotentialCm`
- `weightPotentialKg`
- `growthFulfillment` ∈ [0,1]

Potential is a **ceiling**, not a guarantee.
Training, injuries, and facilities determine how close it is reached.

---

## 5. Skill Evolution (Execution Layer)

Canonical skill outputs:
- **Power** — force generation and drive
- **Speed** — burst and lateral movement
- **Balance** — resistance to displacement and counters
- **Technique** — grip craft, throw timing, transitions
- **Experience** — decision quality and counters

### 5.1 Growth Pattern
- Youth: spiky, uneven gains
- Development: steady improvement
- Prime: diminishing returns
- Veteran: flat or declining effectiveness
- Late: managed decline

Skills are modified by physique:
- Same technique score behaves differently at different weights.

---

## 6. Style Evolution (Primary Public Identity)

Styles:
- **Oshi** — distance, push/thrust
- **Yotsu** — belt, control, throws
- **Hybrid** — adaptable

### 6.1 Style Is Derived
Style is recomputed periodically from:
- weight trends
- balance vs speed ratio
- grip success rates
- kimarite usage distribution
- career phase bias

### 6.2 Hysteresis
- Style changes require sustained signals.
- Prevents oscillation basho-to-basho.

Style is **what the rikishi usually tries to do**.

---

## 7. Archetype Evolution (Temperament Layer)

Archetypes describe **behavior under pressure**.

### 7.1 Dominant Archetype
- Seeded at creation.
- Rarely changes.
- Represents temperament.

### 7.2 Secondary Archetype Drift
- Optional, slow-moving.
- Emerges from repeated behavior patterns.
- Strength ∈ [0.1–0.5].

Dominant archetype applies fully.  
Secondary archetype bends behavior slightly.

---

## 8. Kimarite Identity (Proof of Evolution)

### 8.1 Favored Kimarite (Tokui-waza)
- Tracked from actual wins.
- Top 2–3 maintained.
- Applies 2× selection bonus in combat.

### 8.2 Feedback Loop
Body → Style → Kimarite usage → Favorites → Reinforcement

As the body changes, favored moves may fade or be replaced.

---

## 9. Career Phases (Arc Layer)

Phases are computed, not age-locked:
1. Youth / Prospect
2. Development / Rise
3. Prime
4. Veteran / Decline
5. Late Career / Exit

Inputs:
- age
- growth fulfillment plateau
- injury accumulation
- fatigue recovery slowdown
- performance trends

Phases bias:
- growth rates
- injury risk
- style drift likelihood
- retirement triggers

---

## 10. Determinism Contract

Every evolution step is derived from:
- World seed
- Rikishi seed
- Time index
- Player inputs (training, facilities)
- Deterministic outcomes (bouts, injuries)

No hidden randomness.  
Same inputs → same careers.

---

## 11. UI & Readability Rules

### 11.1 Rikishi Card
- **Style**: primary label
- **Archetype**: secondary
- **Secondary archetype**: only if meaningful
- **Favored kimarite**: visible proof
- Physique shown indirectly via notes, not raw stats by default

### 11.2 Advanced Views
- Physique history
- Style drift timeline
- Kimarite usage charts
- Career journal entries

---

## 12. Narrative Integration

Narrative systems consume evolution:
- “Former speedster adapts to belt fighting”
- “Signature throw fades after knee injury”
- “Late-career reinvention”

Narrative never changes outcomes.

---

## 13. Why This Works

- Careers feel authored, but are not scripted.
- Decline feels earned, not punitive.
- Specialization emerges organically.
- Players learn to *read* wrestlers, not stats.

---

## 14. Canon One-Liner

> **Rikishi evolution is the story of a body adapting to time, pressure, and consequence — expressed through style, behavior, and the techniques that survive.**

---

End of document.

```



---

# PART IX — INJURY STATE MACHINE (EXPLICIT)

## 30. Injury States

Each rikishi maintains exactly one InjuryState:

| State | Description |
|---|---|
| Healthy | No active injury |
| Minor | Short-term strain |
| Moderate | Noticeable impairment |
| Severe | Long-term impairment |
| Chronic | Persistent recurring condition |
| CareerEnding | Forced retirement trigger |

## 31. Injury Severity Thresholds

Severity is determined by:
- fatigue band
- physique stress ratio
- bout intensity band
- accumulated micro-injury count

No random rolls; thresholds are deterministic.

## 32. Recovery Curves

Each state defines:
- minimum recovery weeks
- performance penalty band
- re-injury amplification factor

Chronic injuries permanently reduce recovery efficiency.

---

# PART X — STYLE DRIFT & RECLASSIFICATION

## 33. Style Confidence Model

Each style label maintains a confidence score:
- oshi
- yotsu
- hybrid

Scores update monthly using:
- kimarite usage distribution
- grip success ratios
- physique suitability

## 34. Drift Thresholds

Style changes only when:
- new style confidence > old style by X margin
- sustained for ≥2 basho
- not blocked by injury limitations

Abrupt style flips are impossible.

---

## 35. Favored Kimarite Evolution

Favored kimarite list updates when:
- same kimarite used ≥N times
- above-average success rate
- fits current style

Favorites decay if unused for extended periods.

---

# PART XI — WORKED EXAMPLE (10-YEAR CAREER)

## 36. Rikishi Example: “Kazanoumi”

### Year 1–2 (Prospect)
- rapid weight gain
- minor injuries
- style confidence unclear

### Year 3–5 (Rise)
- oshi style locks in
- favored kimarite: oshidashi, tsukidashi
- first makuuchi promotion

### Year 6–7 (Prime)
- peak power output
- rare injury-free stretch
- sansho awards

### Year 8–9 (Decline)
- chronic knee injury
- style drifts toward defensive yotsu
- fewer favored techniques

### Year 10 (Exit)
- chronic state escalates
- retirement eligibility triggered
- legacy logged

Every step corresponds to weekly and monthly ticks.

---

# PART XII — ADDITIONAL FAILURE & EDGE CASES

- Sudden injury-caused plateau
- Style-lock preventing adaptation
- Late-blooming technique specialists
- Premature burnout via overtraining

All are deterministic outcomes.

---

# PART XIII — EXTENDED SOURCE PRESERVATION

This document preserves **all v1.1 content verbatim**, plus expanded systems.
No earlier rules are removed or weakened.

---

END OF Rikishi Development Canon v1.2


---

# PART XIV — MENTAL & PSYCHOLOGICAL LOAD SYSTEM

## 40. Mental State Model

Each rikishi maintains a **MentalState** vector, separate from physical fatigue:

| Dimension | Description |
|---|---|
| Confidence | Belief in own execution |
| Pressure | External expectation weight |
| Fear | Hesitation under risk |
| Focus | Consistency of decision-making |
| Resilience | Recovery from setbacks |

MentalState values are internal scalars; players see **narrative descriptors only**.

---

## 41. Mental State Inputs (Deterministic)

Mental updates occur weekly and post-bout:

- Win/Loss streaks
- Upsets (positive or negative)
- Rivalry bouts
- Media tone
- Stable stature pressure
- Career phase

No random swings are permitted.

---

## 42. Mental → Performance Mapping

Mental states affect:
- initiative bands
- error likelihood bands
- comeback probability bands
- injury escalation risk

These effects are capped to prevent total collapse.

---

## 43. Psychological Failure Modes

- Confidence spiral (loss streaks)
- Fear lock (post-injury hesitation)
- Pressure collapse (elite expectations)
- Veteran composure advantage

These are system-authored outcomes.

---

# PART XV — TRAINING FACILITIES & STAFF MICRO-EFFECTS

## 50. Facility Bands

Facilities are modeled in qualitative bands:

| Band | Description |
|---|---|
| Primitive | Minimal, outdated |
| Basic | Functional |
| Adequate | Competitive |
| Advanced | Modern, specialized |
| Elite | Cutting-edge |

Facilities modify:
- training efficiency
- injury risk
- recovery speed
- mental fatigue

---

## 51. Staff Roles

Each stable may have:
- Head Coach
- Conditioning Coach
- Medical Staff
- Mental Coach (rare)

Each role provides:
- bias modifiers
- risk dampening
- specialization bonuses

---

## 52. Facility × Training Interaction

Training outputs are multiplied by:
- facility band modifier
- staff competency modifier

Modifiers are deterministic and logged.

---

# PART XVI — RETIREMENT, POST-CAREER & LEGACY

## 60. Retirement Eligibility

Triggered by:
- age thresholds
- chronic injury state
- sustained decline
- governance events

Retirement is optional unless forced.

---

## 61. Retirement Outcomes

Possible paths:
- Stable staff role
- Independent coach
- Oyakata candidate
- Exit from sumo world

Each path affects:
- legacy score
- institutional memory
- future NPC behavior

---

## 62. Legacy Scoring (Narrative)

Legacy is computed from:
- peak rank
- career longevity
- rivalries
- championships
- scandals

Legacy affects:
- how the rikishi is referenced in history
- eligibility for honors
- successor narratives

---

## 63. Post-Career Persistence

Retired rikishi remain:
- in historical records
- as NPCs (if relevant)
- as reference points in commentary

No character is deleted from history.

---

# PART XVII — FULL DEVELOPMENT FLOW SUMMARY

Weekly:
- Training
- Mental update
- Fatigue/injury check

Monthly:
- Evolution consolidation
- Style drift check
- Favored kimarite update

Basho-End:
- Career phase review
- Mental pressure recalibration
- Retirement eligibility check

---

END OF Rikishi Development Canon v1.3

```

---

END OF Beya Management, Staff & Welfare Canon v1.1
