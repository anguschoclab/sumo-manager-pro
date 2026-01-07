# Stable Lords — Foundations Contract v1.0  
## World Bootstrapping, Identity, FTUE & Validation (Definitive)

Date: 2026-01-06  
Status: Canonical, implementation-grade  
Scope: This document defines the **foundational boot contract** for Stable Lords. It binds together:

- World Generation & Initial State
- Global Identity & Unique IDs
- Shikona registry and evolution
- FTUE (First-Time User Experience) gating
- World validation & regeneration rules
- Seeding handshakes with AI, Economy, Governance, and Banzuke

This document exists to ensure the simulation **boots cleanly, deterministically, and forever remains referentially stable**.

If there is ambiguity between documents, **this contract resolves it**.

---

## 1. Why a Foundations Contract Exists

Stable Lords is a long-horizon institutional simulation.
Failure at boot time creates:
- broken history
- orphaned entities
- unexplainable governance outcomes
- FTUE exploits or unfair wipes

This document prevents those failures.

> Institutions do not collapse because of what happens later — they collapse because of what they were built on.

---

## 2. Boot Sequence (Authoritative)

World creation proceeds in the following **non-negotiable order**:

1. Initialize `worldSeed`
2. Generate identity registries (IDs, shikona)
3. Generate beya topology
4. Allocate kabu pool
5. Seed NPC managers
6. Generate rikishi population
7. Assign shikona
8. Seed rivalries
9. Generate initial banzuke
10. Initialize economy state
11. Run world validation
12. Apply FTUE safety gates
13. Begin simulation tick

Any failure before step 11 regenerates the world.

---

## 3. Global Identity & ID Authority

### 3.1 Canonical Primary Keys

The following IDs are **globally authoritative** and used across all systems:

- RikishiID
- OyakataID
- BeyaID
- BoutID
- GovernanceRulingID
- MediaEventID

Names, titles, and shikona are **presentation-layer only**.

---

### 3.2 Lifecycle Rules

- IDs are immutable
- IDs are never reused
- Mergers:
  - surviving beya retains BeyaID
  - merged beya ID is archived
- Closures:
  - BeyaID is retired, never reused
- Shikona changes:
  - do NOT affect RikishiID
  - old names become aliases

---

## 4. Worldgen Output Objects (Contract)

World generation must emit the following objects:

### 4.1 Beya Object
- BeyaID
- Prestige
- Facilities
- Staff
- Kōenkai strength
- Debt state
- Kabu holder
- Rivalry links

### 4.2 Oyakata Object
- OyakataID
- Age
- Philosophy profile
- Risk tolerance
- Rivalry sensitivity
- Succession horizon
- Kabu ownership

### 4.3 Rikishi Object
- RikishiID
- Birth year
- Height / weight baseline
- Style & archetype
- Injury risk profile
- Shikona
- Stable affiliation
- Career stage

---

## 5. Shikona Registry Contract

### 5.1 Registry Authority

- All shikona are registered at worldgen
- Registry enforces:
  - kanji uniqueness
  - phonetic uniqueness
  - lineage rules

---

### 5.2 Stored Fields

Each shikona entry stores:
- kanji string
- kana reading
- romanization
- originating beya
- lineage kanji
- active / retired status

Aliases persist permanently.

---

### 5.3 Evolution Rules (Binding)

- Shikona changes allowed only on promotion thresholds
- Must preserve ≥1 lineage kanji unless honorary exception
- Logged permanently
- Old names remain searchable

---

## 6. Rivalry Seeding Handshake

### 6.1 Seeding Rules

Worldgen seeds:
- 5–10 stable rivalries
- 10–20 rikishi rivalries
- 2–4 oyakata rivalries

No rivalry may start above **Recognized** tier.

---

### 6.2 AI Perception Mapping

| Seeded Intensity | AI Tier |
|---|---|
| Low | Background |
| Moderate | Recognized |
| High | Heated |

This mapping is fixed and deterministic.

---

## 7. Banzuke Initialization Contract

- Initial banzuke must be fully valid per Banzuke v1.1
- No open slots
- East/West rules enforced
- Rank distribution must reflect prestige spread

Failure regenerates world.

---

## 8. Economy Initialization Contract

At start:
- No beya may begin with < 2 weeks runway
- No beya may begin Insolvent
- Debt may exist only at low/moderate levels
- At least 20% of beya are financially stressed

These create early narrative pressure.

---

## 9. Governance & Kabu Validation

- Every active beya must have exactly one kabu holder
- 10–20% of kabu flagged as near-expiry (succession risk)
- No kabu conflicts permitted

Failure regenerates world.

---

## 10. FTUE Safety Gates (Authoritative)

### 10.1 FTUE Window

FTUE window = first **1 basho** after world start.

During FTUE:
- Governance actions above **Restriction** level are suppressed
- Closures are forbidden
- Forced mergers are forbidden
- Warnings are allowed and logged
- Economic failure still accumulates state

---

### 10.2 Post-FTUE Release

At end of FTUE basho:
- All suppressed triggers are re-evaluated
- No forgiveness is granted
- Player receives explicit warnings

FTUE never deletes consequences — it delays them.

---

## 11. World Validation Checklist

A world is playable only if:

- IDs are unique
- Shikona registry has no collisions
- Banzuke is valid
- All beya solvent ≥ 2 weeks
- Kabu coverage valid
- Rivalry minimums met
- At least 1 elite and 1 fragile beya exist

Failure → regenerate.

---

## 12. Determinism Contract

Given:
- same worldSeed
- same era preset

World boot state is identical.

---

## 13. Canon One-Liners

- **On identity:**  
  > “Names change. IDs do not.”

- **On FTUE:**  
  > “The world gives you one breath before it starts judging.”

- **On foundations:**  
  > “If the world boots cleanly, everything else can fail honestly.”

---

End of Foundations Contract v1.0
