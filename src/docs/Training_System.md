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
