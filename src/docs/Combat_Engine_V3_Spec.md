# Stable Lords — Combat Engine V3 (Deterministic) Specification v1.0

Date: 2026-01-06  
Status: Canonical, verbose, implementation-ready  
Scope: This document defines **Combat Engine V3**, the deterministic bout-resolution engine used by Stable Lords. It explains phases, inputs, outputs, weighting, counters, logging, and integration with rikishi evolution and kimarite systems.

---

## 1. Design Goals

Combat Engine V3 must:
- Produce **authentic sumo outcomes** with believable frequency
- Be **fully deterministic** under a seed
- Generate **structured logs** for narrative and analytics
- Integrate with:
  - Rikishi evolution (physique, skills, style, archetype)
  - Kimarite tier/style/archetype weighting
  - Fatigue, momentum, and injuries
- Remain **tunable without rewriting code**

---

## 2. Determinism Contract

Every bout outcome is derived from:
- World seed
- Bout seed (world seed + basho + day + match index + rikishi IDs)
- Current rikishi state (physique, skills, fatigue, injuries, style, archetype)
- No calls to `Date.now()` or unseeded randomness

**Same inputs → same bout, every time.**

---

## 3. High-Level Bout Flow

1. Tachiai phase
2. Clinch / grip resolution
3. Momentum ticks
4. Finisher window (kimarite selection)
5. Counter resolution (optional)
6. Result + structured logs

---

## 4. Phase 1 — Tachiai

### Purpose
Determine initial initiative and advantage.

### Inputs
- Power, speed, balance
- Mass differential
- Fatigue
- Momentum
- Archetype tachiai bias

### Outputs
- Initial advantage score
- Initiative holder
- Narrative log entry

---

## 5. Phase 2 — Clinch / Grip Battle

### Purpose
Determine stance and grip context.

### Possible stances
- push-dominant
- belt-dominant
- no-grip
- migi-yotsu
- hidari-yotsu

### Inputs
- Style (oshi/yotsu/hybrid)
- Technique and experience
- Grip preference
- Height and reach

### Outputs
- Stance
- Grip state
- Narrative log entry

---

## 6. Phase 3 — Momentum Ticks

### Purpose
Simulate mid-bout flow and volatility.

### Loop behavior
- Fatigue accumulates
- Advantage may shift
- Position may change:
  - frontal
  - lateral
  - rear

### Inputs
- Balance
- Experience
- Speed
- Fatigue
- Archetype counter bias

### Outputs
- Updated advantage
- Position
- Narrative log entries per tick

---

## 7. Phase 4 — Finisher Window (Kimarite Selection)

### Purpose
Select a plausible finishing technique.

### Steps
1. Filter kimarite registry by:
   - stance requirements
   - grip needs
   - position/vector constraints
2. Weight remaining kimarite using:
   - baseWeight
   - tier multiplier
   - style × tier shaping
   - stance bias
   - position bias
   - archetype class bias
   - favored kimarite bonus
3. Normalize and sample deterministically

**See separate Kimarite Tier / Style / Archetype spec for full math.**

---

## 8. Phase 5 — Counter Resolution

### Purpose
Allow defender to flip outcome.

### Counter probability influenced by:
- Balance
- Experience
- Fatigue difference
- Archetype counter bias
- Position

### If counter triggers
- Select defensive kimarite class subset
- Resolve counter deterministically
- Log counter event

---

## 9. Phase 6 — Result & Logging

### BoutResult includes
- Winner / loser IDs
- Final kimarite
- Duration (ticks)
- Stance history
- Position history
- Fatigue delta
- Injury checks (post-bout)

### Narrative Log Contract
Each log entry includes:
- phase
- description (human-readable)
- structured data payload for UI/analytics

---

## 10. Injury Checks (Post-Bout)

Injury risk derived from:
- Fatigue
- Mass
- Bout length
- Prior injuries
- Deterministic seed

Injuries are applied **after** the bout result.

---

## 11. Integration Points

Combat Engine V3 consumes:
- Rikishi evolution state
- Kimarite registry
- Style/archetype matrices

Combat Engine V3 produces:
- BoutResult
- Logs
- Fatigue deltas
- Injury events
- Momentum changes

---

## 12. Tunable Parameters (Non-Code)

Designers should be able to tune:
- Phase weightings
- Fatigue accumulation rates
- Counter frequency
- Tier/style/archetype multipliers
- Log verbosity

Without changing engine structure.

---

## 13. Why V3 Works

- Phased model matches real bout flow
- Determinism enables debugging and replay
- Registry-driven endings prevent hardcoding
- Evolution systems naturally express themselves through outcomes

---

## 14. Canon One-Liner

> **Combat Engine V3 resolves sumo bouts by simulating initiative, control, pressure, and opportunity — then selecting an authentic ending from the official kimarite space under deterministic rules.**

---

End of document.
