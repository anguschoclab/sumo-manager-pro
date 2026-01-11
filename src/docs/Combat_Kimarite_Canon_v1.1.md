
# Stable Lords — Combat & Kimarite Resolution Canon v1.1
## Ultra-Granular, Implementation-Grade Specification (Bout System Only)

Status: **DEFINITIVE**
Scope lock: **Combat, Kimarite, Bout Resolution, and Narrative Emission only**

This document replaces v1.0 and is intentionally:
- larger than its source documents
- non-lossy
- explicit down to data-field and resolution-order level

---

# PART I — HARD DESIGN LAWS (COMBAT SCOPE)

## 1. Determinism
Every bout outcome is a pure function of:
- WorldSeed
- BoutSeed = hash(WorldSeed, BashoId, Day, BoutIndex, RikishiAId, RikishiBId)
- Immutable rikishi state snapshots at bout start

No RNG calls outside seeded resolution.
No floating nondeterminism.
No animation-driven variance.

## 2. Separation of Concerns
- Combat Engine produces **facts**
- Narrative/PBP consumes facts
- Narrative NEVER feeds back into resolution

---

# PART II — COMBAT ENGINE V3 (VERBATIM + BINDING)

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


---

# PART III — KIMARITE SYSTEM (VERBATIM + BINDING)

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


---

# PART IV — OFFICIAL 82 KIMARITE REGISTRY (INLINE, CANONICAL)

This registry is **binding engine data**, not reference material.

## Tier Definitions (Simulation)
- Common: bread-and-butter, majority of bouts
- Uncommon: situational but believable
- Rare: specialist or positional edge
- Legendary: highlight-only, extreme rarity

Tier multipliers:
- Common: 1.00
- Uncommon: 0.55
- Rare: 0.20
- Legendary: 0.05

---

## Kihonwaza (7)

| id | en | ja | class | vector | tier |
|---|---|---|---|---|---|
| yorikiri | Yorikiri | 寄り切り | force_out | frontal | common |
| yoritaoshi | Yoritaoshi | 寄り倒し | force_out | frontal | common |
| oshidashi | Oshidashi | 押し出し | push | frontal | common |
| oshitaoshi | Oshitaoshi | 押し倒し | push | frontal | common |
| tsukidashi | Tsukidashi | 突き出し | push | frontal | common |
| tsukitaoshi | Tsukitaoshi | 突き倒し | push | frontal | common |
| abisetaoshi | Abisetaoshi | 浴せ倒し | force_out | frontal | uncommon |

---

## Nagete (13)

| id | en | ja | class | vector | tier |
|---|---|---|---|---|---|
| uwatenage | Uwatenage | 上手投げ | throw | lateral | common |
| shitatenage | Shitatenage | 下手投げ | throw | lateral | common |
| uwatedashinage | Uwatedashinage | 上手出し投げ | throw | lateral | uncommon |
| shitatedashinage | Shitatedashinage | 下手出し投げ | throw | lateral | uncommon |
| kotenage | Kotenage | 小手投げ | throw | lateral | common |
| sukuinage | Sukuinage | 掬い投げ | throw | lateral | common |
| kubinage | Kubinage | 首投げ | throw | lateral | uncommon |
| kakenage | Kakenage | 掛け投げ | throw | lateral | uncommon |
| koshinage | Koshinage | 腰投げ | throw | lateral | rare |
| tsukaminage | Tsukaminage | つかみ投げ | throw | lateral | uncommon |
| nichonage | Nichonage | 二丁投げ | throw | lateral | rare |
| yaguranage | Yaguranage | 櫓投げ | throw | lateral | legendary |
| ipponzeoi | Ipponzeoi | 一本背負い | throw | lateral | legendary |

---

## Kakete (18)
| id | en | ja | class | vector | tier |
|---|---|---|---|---|---|
| sotogake | Sotogake | 外掛け | trip | lateral | uncommon |
| uchigake | Uchigake | 内掛け | trip | lateral | uncommon |
| kekaeshi | Kekaeshi | 蹴返し | trip | frontal | uncommon |
| ketaguri | Ketaguri | 蹴手繰り | trip | frontal | uncommon |
| ashitori | Ashitori | 足取り | trip | frontal | rare |
| komatasukui | Komatasukui | 小股掬い | trip | lateral | rare |
| kirikaeshi | Kirikaeshi | 切り返し | trip | lateral | rare |
| kozumatori | Kozumatori | 小褄取り | trip | frontal | rare |
| susotori | Susotori | 裾取り | trip | frontal | rare |
| susoharai | Susoharai | 裾払い | trip | lateral | rare |
| sotokomata | Sotokomata | 外小股 | trip | lateral | rare |
| chongake | Chongake | ちょん掛け | trip | lateral | rare |
| omata | Omata | 大股 | trip | lateral | rare |
| tsumatori | Tsumatori | 褄取り | trip | frontal | rare |
| watashikomi | Watashikomi | 渡し込み | trip | frontal | legendary |
| kawazugake | Kawazugake | 河津掛け | trip | lateral | legendary |
| mitokorozeme | Mitokorozeme | 三所攻め | trip | lateral | legendary |
| nimaigeri | Nimaigeri | 二枚蹴り | trip | frontal | legendary |

---

## Hinerite (19)
| id | en | ja | class | vector | tier |
|---|---|---|---|---|---|
| tsukiotoshi | Tsukiotoshi | 突き落とし | twist | frontal | common |
| katasukashi | Katasukashi | 肩透かし | twist | frontal | uncommon |
| makiotoshi | Makiotoshi | 巻き落とし | twist | frontal | uncommon |
| tottari | Tottari | とったり | twist | frontal | uncommon |
| sabaori | Sabaori | 鯖折り | twist | frontal | uncommon |
| sotomuso | Sotomuso | 外無双 | twist | lateral | uncommon |
| uchimuso | Uchimuso | 内無双 | twist | lateral | uncommon |
| uwatehineri | Uwatehineri | 上手捻り | twist | lateral | uncommon |
| shitatehineri | Shitatehineri | 下手捻り | twist | lateral | uncommon |
| kotehineri | Kotehineri | 小手捻り | twist | frontal | rare |
| kainahineri | Kainahineri | 腕捻り | twist | frontal | rare |
| amiuchi | Amiuchi | 網打ち | twist | frontal | rare |
| kubihineri | Kubihineri | 首捻り | twist | lateral | rare |
| harimanage | Harimanage | 波離間投げ | twist | lateral | rare |
| osakate | Osakate | 大逆手 | twist | lateral | legendary |
| zubuneri | Zubuneri | ずぶねり | twist | frontal | legendary |
| gasshohineri | Gasshohineri | 合掌捻り | twist | lateral | legendary |
| tokkurinage | Tokkurinage | 徳利投げ | twist | lateral | legendary |
| sakatottari | Sakatottari | 逆とったり | twist | frontal | legendary |

---

## Sorite (6)
| id | en | ja | class | vector | tier |
|---|---|---|---|---|---|
| izori | Izori | 居反り | special | rear | legendary |
| kakezori | Kakezori | 掛け反り | special | rear | legendary |
| shumokuzori | Shumokuzori | 撞木反り | special | rear | legendary |
| sototasukizori | Sototasukizori | 外たすき反り | special | rear | legendary |
| tasukizori | Tasukizori | たすき反り | special | rear | legendary |
| tsutaezori | Tsutaezori | 伝え反り | special | rear | legendary |

---

## Tokushuwaza (19)
| id | en | ja | class | vector | tier |
|---|---|---|---|---|---|
| hatakikomi | Hatakikomi | 叩き込み | special | frontal | common |
| hikiotoshi | Hikiotoshi | 引き落とし | special | frontal | common |
| hikkake | Hikkake | 引っ掛け | special | lateral | uncommon |
| okuridashi | Okuridashi | 送り出し | rear | rear | common |
| okuritaoshi | Okuritaoshi | 送り倒し | rear | rear | uncommon |
| okurihikiotoshi | Okurihikiotoshi | 送り引き落とし | rear | rear | rare |
| okurinage | Okurinage | 送り投げ | rear | rear | rare |
| okurigake | Okurigake | 送り掛け | rear | rear | uncommon |
| okuritsuridashi | Okuritsuridashi | 送り吊り出し | lift | rear | rare |
| okuritsuriotoshi | Okuritsuriotoshi | 送り吊り落とし | lift | rear | rare |
| tsuridashi | Tsuridashi | 吊り出し | lift | frontal | uncommon |
| tsuriotoshi | Tsuriotoshi | 吊り落とし | lift | frontal | uncommon |
| kimedashi | Kimedashi | 極め出し | force_out | frontal | rare |
| kimetaoshi | Kimetaoshi | 極め倒し | special | frontal | rare |
| waridashi | Waridashi | 割り出し | force_out | lateral | rare |
| utchari | Utchari | うっちゃり | special | lateral | uncommon |
| yobimodoshi | Yobimodoshi | 呼び戻し | special | frontal | rare |
| ushiromotare | Ushiromotare | 後ろもたれ | rear | rear | rare |
| sokubiotoshi | Sokubiotoshi | 素首落とし | special | rear | rare |

---

# PART V — Winning Non-Techniques (Hiwaza)

| id | en | ja |
|---|---|---|
| fumidashi | Fumidashi | 踏み出し |
| isamiashi | Isamiashi | 勇み足 |
| koshikudake | Koshikudake | 腰砕け |
| tsukihiza | Tsukihiza | つきひざ |
| tsukite | Tsukite | つき手 |

---

# PART VI — Unified Bout Resolution Algorithm (Granular)

1. Compute tachiai impulse
2. Resolve stance dominance
3. Resolve grip availability
4. Enter momentum loop (ticks)
5. Filter kimarite by:
   - position
   - stance
   - grip
6. Apply tier multipliers
7. Apply style bias
8. Apply archetype bias
9. Apply favorite-move bias
10. Select winning kimarite deterministically
11. Emit BoutResult
12. Log to ledger

---

# PART VII — Source Preservation Annex (Verbatim)

## Combat Engine V3
```md
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

```

## Kimarite Tier / Style / Archetype System
```md
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

```
