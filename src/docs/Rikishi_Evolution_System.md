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
