
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
