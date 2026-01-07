# Stable Lords — Kimarite Selection System v1.0
Date: 2026-01-06  
Scope: Canonical description of how **kimarite tiers**, **styles**, and **tactical archetypes** interact inside **Combat Engine V3 (Option A)**.

This document is written to be implementation-ready and tuning-friendly. It defines:
- what each layer means (tier vs style vs archetype),
- the exact weighting pipeline (order matters),
- default numeric tables (safe starting values),
- one single diagram of the selection funnel,
- a worked example.

---

## 1) Core idea

Kimarite selection is a deterministic, data-driven weighted choice over the **official 82 kimarite**.  
For each bout, the engine does **not** pick a “move animation” first. Instead it:

1. Determines the *state of the bout* (stance, position, grip context, fatigue, etc.)
2. Filters the kimarite registry to only those that are legal/plausible in that state
3. Weights the remaining options using layered multipliers
4. Samples deterministically (seeded RNG) to select the finishing kimarite
5. Resolves success vs counter (still deterministic), then emits logs

The system is designed to create:
- authenticity (common finishes dominate),
- identity (specialists drift toward signatures),
- variety (situational techniques appear in believable contexts),
- narrative “spikes” (rare/legendary moments exist, but stay rare).

---

## 2) Definitions: three layers that must not be merged

### 2.1 Kimarite Tier (Common / Uncommon / Rare / Legendary)
**Tier answers:** “How often does this technique show up in sumo at all?”  
It is **global plausibility**, independent of any individual rikishi.

Tier is the main “frequency ceiling” control:
- Common should dominate most bouts
- Legendary should remain highlight-only even for the best-fitting style/archetype

### 2.2 Style (oshi / yotsu / hybrid)
**Style answers:** “What does this rikishi’s body + training naturally support right now?”  
Style is a **technical comfort layer** derived from:
- physique deltas (mass, balance, speed)
- observed outcomes (kimarite distribution)
- grip success distribution (belt-dominant frequency)
- coaching emphasis (future)
- archetype as a *soft bias*, never a lock

Style changes slowly (recommended cadence: end of basho, with hysteresis).

### 2.3 Tactical Archetype (behavioral bias)
**Archetype answers:** “How does this rikishi choose actions under pressure?”  
Archetype is a **behavioral bias layer** that primarily affects:
- which *classes* of kimarite are preferred (force-out vs throw vs slap-pull)
- willingness to take volatility (risk appetite, counter windows)

Archetype does **not** magically grant technical ability.  
It amplifies tendencies after plausibility and comfort are established.

---

## 3) Single diagram: the selection funnel (order is canonical)

```
            ┌───────────────────────────────────────────┐
            │           Bout state is computed           │
            │ stance, position, grip context, fatigue... │
            └───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 1) FILTER (hard gates)                                           │
│    - required stances                                            │
│    - gripNeed constraints                                        │
│    - position/vector constraints (frontal/lateral/rear)          │
│    - remove non-endings (forfeits unless explicitly allowed)     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2) BASE WEIGHT (per kimarite)                                    │
│    - intrinsic frequency within the 82 registry                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3) TIER MULTIPLIER (global plausibility ceiling)                 │
│    Common / Uncommon / Rare / Legendary                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4) STYLE MULTIPLIER (technical comfort)                          │
│    oshi / yotsu / hybrid × tier shaping                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5) STANCE + POSITION MULTIPLIERS (context bias)                  │
│    - stance biases classes                                       │
│    - position biases vectors                                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6) ARCHETYPE CLASS MULTIPLIERS (behavioral bias)                 │
│    - affects kimarite classes (force-out/throw/slap/...)          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7) FAVORITES (tokui-waza)                                        │
│    - if kimarite in favoredKimarite[] apply bonus                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
            ┌───────────────────────────────────────────┐
            │ 8) Normalize weights and sample (seeded)   │
            └───────────────────────────────────────────┘
                              │
                              ▼
            ┌───────────────────────────────────────────┐
            │ 9) Counter resolution + final BoutResult   │
            └───────────────────────────────────────────┘
```

**Canonical rule:** tiers → style → stance/position → archetype → favorites (in that order).

---

## 4) Default numeric tables (safe starting values)

These tables are designed to:
- keep Common endings dominant,
- allow situational diversity,
- preserve “legendary” rarity,
- let favorites meaningfully emerge over a career.

### 4.1 Tier multipliers (global)
Apply after `baseWeight`.

| Tier | Multiplier |
|---|---:|
| Common | 1.00 |
| Uncommon | 0.55 |
| Rare | 0.20 |
| Legendary | 0.05 |

> Tuning note: if your sim feels too repetitive, raise **Uncommon** first (e.g., 0.55 → 0.65).  
Avoid raising Legendary early; it should stay “wow.”

### 4.2 Style × Tier shaping multipliers
Apply after Tier multipliers. This table shapes how styles distribute probability mass across tiers.

| Style → / Tier ↓ | Common | Uncommon | Rare | Legendary |
|---|---:|---:|---:|---:|
| **Oshi** | 1.15 | 0.90 | 0.60 | 0.30 |
| **Yotsu** | 1.15 | 1.05 | 0.80 | 0.40 |
| **Hybrid** | 1.10 | 1.00 | 0.90 | 0.50 |

Interpretation:
- **Oshi** compresses outcomes toward the center (bread-and-butter).
- **Yotsu** allows rare techniques more often (throws/twists emerge).
- **Hybrid** preserves optionality and increases “off-path” plausibility slightly.

### 4.3 Kimarite class multipliers by archetype (canonical Option A defaults)
These are *behavioral biases* and should be applied to the kimarite’s **class**.

| Archetype | force_out/push/thrust | throw/twist/lift | slap_pull | trip/evasion | rear | special |
|---|---:|---:|---:|---:|---:|---:|
| **Oshi Specialist** | 1.45 | 0.85 | 1.10 | 0.95 | 1.05 | 0.80 |
| **Yotsu Specialist** | 1.05 | 1.55 | 0.90 | 0.95 | 1.15 | 1.00 |
| **Speedster** | 1.05 | 0.90 | 1.20 | 1.60 | 1.10 | 0.95 |
| **Trickster** | 0.85 | 0.95 | 1.65 | 1.35 | 1.05 | 1.20 |
| **All‑Rounder** | 1.15 | 1.15 | 1.10 | 1.10 | 1.10 | 1.00 |

> Canon note: “rear” is mostly unlocked by **position**, so multipliers are modest here.

### 4.4 Stance → Class bias multipliers (canonical Option A defaults)
Stance is determined in the clinch/grip phase and biases which classes are plausible.

| Stance | force_out/push/thrust | throw/twist/lift | slap_pull | trip/evasion | rear |
|---|---:|---:|---:|---:|---:|
| **push-dominant** | 1.45 | 0.85 | 1.20 | 1.10 | 1.00 |
| **belt-dominant** | 0.95 | 1.55 | 0.90 | 1.00 | 1.10 |
| **migi-yotsu / hidari-yotsu** | 1.00 | 1.45 | 0.95 | 1.05 | 1.10 |
| **no-grip** | 1.05 | 0.65 | 1.30 | 1.20 | 0.80 |

### 4.5 Position → Vector bias multipliers (canonical Option A defaults)
Position is computed during momentum ticks.

| Position | frontal vector | lateral vector | rear vector |
|---|---:|---:|---:|
| **frontal** | 1.15 | 1.00 | 0.70 |
| **lateral** | 1.00 | 1.20 | 0.85 |
| **rear** | 0.80 | 0.95 | 2.25 |

### 4.6 Favorites (tokui-waza) multiplier
If the selected move is in attacker’s `favoredKimarite[]`:

| Condition | Multiplier |
|---|---:|
| kimarite ∈ favoredKimarite | 2.00 |
| otherwise | 1.00 |

This is the main mechanism that creates signature moves organically over time.

---

## 5) The full weight formula (implementation-ready)

For each candidate kimarite `k` after filtering:

```
weight(k) =
  baseWeight(k)
  * tierMult( tier(k) )
  * styleTierMult( style(attacker), tier(k) )
  * stanceClassMult( stance, class(k) )
  * positionVectorMult( position, vector(k) )
  * archetypeClassMult( archetype(attacker), class(k) )
  * favoriteMult( k in favoredKimarite )
  * rarityDampening(k)   // optional, if you keep a separate rarity scalar
```

Then normalize and sample deterministically.

**Determinism rule:** the same bout seed and same state produces the same selection.

---

## 6) Why tiers, style, and archetype are separate (the “no collapse” rule)

If you collapse these layers, you get pathological behavior:
- archetype overriding tier → Trickster spams legendary techniques
- style overriding plausibility → Oshi suddenly sukuinage-spams
- merging style+archetype → you lose the distinction between *body* and *behavior*

**Canonical one-liner:**
> Kimarite tiers define global plausibility, styles define technical comfort, and archetypes define behavioral bias — in that order, and never as substitutes for one another.

---

## 7) Worked example (numbers you can sanity-check)

Scenario:
- Candidate kimarite: **kotenage**
- baseWeight(kotenage) = 1.0 (example)
- tier(kotenage) = Uncommon
- attacker style = Yotsu
- attacker archetype = Yotsu Specialist
- stance = belt-dominant
- position = frontal
- kotenage class = throw/twist/lift
- vector = frontal
- kotenage is in favoredKimarite[] (yes)

Compute:

- tierMult(Uncommon) = 0.55
- styleTierMult(Yotsu, Uncommon) = 1.05
- stanceClassMult(belt-dominant, throw/twist/lift) = 1.55
- positionVectorMult(frontal, frontal) = 1.15
- archetypeClassMult(Yotsu Specialist, throw/twist/lift) = 1.55
- favoriteMult = 2.0

So:

`weight = 1.0 * 0.55 * 1.05 * 1.55 * 1.15 * 1.55 * 2.0`

= 0.55 * 1.05 = 0.5775  
0.5775 * 1.55 = 0.8951  
0.8951 * 1.15 = 1.0294  
1.0294 * 1.55 = 1.5956  
1.5956 * 2.0 = **3.1912**

Interpretation:
- Even though kotenage is “Uncommon,” the correct style/stance/archetype plus favorites make it very viable.
- This is exactly how signature techniques become common **for the right rikishi** without breaking global plausibility.

---

## 8) Practical tuning guidance (what to change first)

If you see… | Change…
---|---
Too repetitive | Increase Uncommon tier (0.55 → 0.60–0.70)
Too many weird finishes | Reduce Rare and Legendary (Rare 0.20 → 0.15; Legendary 0.05 → 0.03)
Styles feel indistinct | Increase style-tier separation (e.g., Oshi Rare 0.60 → 0.50; Yotsu Rare 0.80 → 0.90)
Archetypes feel weak | Slightly widen archetype multipliers (±0.05–0.10), not tiers
Favorites feel meaningless | Increase favorites (2.0 → 2.3) **only after** tier/style are stable

---

## 9) Deliverables this document assumes exist elsewhere

This document assumes:
- a correct 82-kimarite registry with fields:
  - `id`, `displayName`, `class`, `tier`, `requiredStances`, `gripNeed`, `vector`
  - `baseWeight`
- the canonical stance and position determination from Combat Engine V3
- favored kimarite tracking (tokui-waza) in the rikishi model

---

End of document.
