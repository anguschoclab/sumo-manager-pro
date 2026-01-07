# Stable Lords — Banzuke, Scheduling & Basho Awards System v1.1 (Canonical)

Date: 2026-01-06  
Status: Canonical, verbose, implementation-ready  
Supersedes: Banzuke & Scheduling System v1.0  
Scope: Defines **divisions, rankings (banzuke), torikumi scheduling, promotion/demotion, playoffs, and basho awards**, including special prizes and trophy logic.

This system converts raw bout outcomes into **status, prestige, income signals, and historical memory**.

---

## 1. Design Goals

This system must:
- Preserve **sumo legitimacy and ritual**
- Be **fully deterministic**
- Produce **explainable rankings and awards**
- Create **multiple success vectors** beyond yusho
- Feed economy, AI planning, narrative, and careers

> Winning matters — but *how* you win matters too.

---

## 2. Divisions & Banzuke (Recap)

Divisions, sizes, rank encoding, and reassignment rules remain as defined in v1.0.
This document **extends** that system; it does not alter core rank math.

---

## 3. Basho Structure (Recap)

- 15 days per basho
- One bout per day in upper divisions
- Fixed bout counts in lower divisions
- Playoffs after Day 15 if required

All bouts generate:
- result
- kimarite
- duration
- fatigue delta
- narrative hooks

---

## 4. Basho Awards Overview

Awards exist to:
- reward **exceptional performance**
- recognize **style, spirit, and technique**
- create **secondary goals**
- generate prestige and headlines

Awards are determined **after all bouts and playoffs** conclude.

---

## 5. Sanshō (Special Prizes)

Sanshō are awarded only to **Maegashira and below** (never Yokozuna, typically not Ozeki).

### 5.1 Fighting Spirit Prize (Kantō-shō)

**Intent:** Reward grit, aggression, and exceeding expectations.

**Eligibility:**
- Rank: M1 or lower
- Minimum wins: 8
- Not withdrawn early

**Scoring Signals:**
- Wins vs higher-ranked opponents
- Upset victories
- Long or intense bouts
- High fatigue tolerance

**Deterministic Selection:**
```
FightingSpiritScore =
  upsetWins * 3
+ winsAboveExpectation * 2
+ highIntensityBouts
```

Top score receives the prize.

---

### 5.2 Technique Prize (Ginō-shō)

**Intent:** Reward technical variety and execution.

**Eligibility:**
- Rank: M1 or lower
- Minimum wins: 8

**Scoring Signals:**
- Number of distinct kimarite used
- Use of Uncommon / Rare kimarite tiers
- Successful throws and counters

**Deterministic Selection:**
```
TechniqueScore =
  uniqueKimarite
+ rareTierFinishes * 2
+ cleanThrowWins
```

---

### 5.3 Outstanding Performance Prize (Shukun-shō)

**Intent:** Reward landmark achievements.

**Eligibility:**
- Rank: M1 or lower
- Minimum wins: 8

**Qualifying Feats (any):**
- Defeating Yokozuna
- Defeating multiple Ozeki
- Directly deciding yusho outcome

Highest-impact feat wins.

---

### 5.4 Multiple Sanshō

A rikishi **may win more than one sanshō** if scores independently qualify.
This is rare and narratively emphasized.

---

## 6. Emperor’s Cup (Yūshō)

**Awarded to:** Basho champion

- Includes Emperor’s Cup
- Confers large prestige
- Anchors basho history
- Strongly influences promotion heuristics

Yusho prestige scales by:
- division
- strength of schedule
- playoff participation

---

## 7. Additional Trophies & Awards (Based on Official Sumo Trophies)

These trophies are **deterministic achievements**, not random gifts.

### 7.1 Prime Minister’s Cup
- Awarded to yusho winner
- Symbolic prestige multiplier

### 7.2 Japan Sumo Association Cup
- Awarded to yusho winner
- Counts toward historical tallies

### 7.3 MacArthur Cup (Foreign-born Yusho)
- Awarded if yusho winner is foreign-born
- Adds international prestige narrative

### 7.4 Technique Excellence Trophy
- Awarded to highest TechniqueScore (even if no sanshō due to rank)
- May be suppressed for Yokozuna/Ozeki for realism

### 7.5 Fighting Spirit Trophy
- Parallel to Kantō-shō
- Used for narrative + analytics even if sanshō not awarded

---

## 8. Award Determination Order

1. Resolve playoffs
2. Lock final records
3. Compute sanshō scores
4. Validate eligibility constraints
5. Assign trophies
6. Emit award events

No award may affect rank outcomes retroactively.

---

## 9. Data Contracts

### 9.1 Award Object

```ts
Award {
  id: string
  type: AwardType
  bashoId: string
  rikishiId: string
  division: DivisionID
  rationale: string
}
```

---

### 9.2 Basho Summary Output

Each basho emits:
- yusho winner
- playoff participants
- sanshō winners
- trophy list
- notable feats

Stored immutably.

---

## 10. Integration with Other Systems

### 10.1 Economy
- Awards increase prestige
- Prestige boosts banner attraction
- No direct cash injection unless specified elsewhere

---

### 10.2 AI Managers
- Track award frequency
- Value sanshō as success signals
- Adapt recruitment based on award patterns (e.g., technique-heavy stables)

---

### 10.3 Rikishi Evolution
- Awards influence morale and confidence
- Repeated awards accelerate reputation growth
- No direct stat buffs

---

### 10.4 Narrative System
- Awards generate headlines
- Multi-award basho heavily emphasized
- Historical comparisons unlocked

---

## 11. Player UX Rules

- Awards shown on basho recap screen
- Icons attached to rikishi career pages
- Tooltips explain why an award was earned
- No hidden or unexplained awards

---

## 12. Edge Cases & Guardrails

- Withdrawn rikishi cannot receive sanshō
- Yokozuna generally excluded from sanshō
- Determinism enforced: same basho → same awards
- Suppression rules documented and visible

---

## 13. Canon One-Liner

> **Basho awards exist to honor excellence beyond the win–loss record, turning performance into legacy.**

---

End of document.
