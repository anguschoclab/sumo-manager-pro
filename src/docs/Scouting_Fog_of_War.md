# Stable Lords — Scouting, Information & Fog‑of‑War System v1.0 (Canonical)

Date: 2026-01-06  
Status: Canonical, verbose, implementation‑grade  
Scope: This document defines how **information is discovered, distorted, and acted upon** in Stable Lords.  
It is the authoritative contract for:

- Scouting systems (rikishi, stables, managers)
- Information quality, uncertainty, and confidence bands
- Fog‑of‑war rules for players and NPC AI
- Information decay, misinformation, and inference
- UI affordances for partial knowledge
- Integration with AI, economy, training, governance, and narrative

If a decision depends on *knowledge*, this system governs it.

---

# PART I — DESIGN PHILOSOPHY

## 1. Why Fog‑of‑War Exists

Without uncertainty:
- the optimal strategy becomes obvious
- NPC AI feels fake or “cheaty”
- narrative tension collapses
- long‑term planning becomes spreadsheet math

Stable Lords is a **management simulation, not an oracle**.

> Perfect information kills institutions.

---

## 2. Core Principles

The information system must:
- be asymmetric but fair
- degrade gracefully over time
- reward sustained observation
- never lie randomly
- remain deterministic

NPC AI and players obey the **same rules**.

---

# PART II — INFORMATION CATEGORIES

## 3. What Can Be Known (Domains)

Information is partitioned into domains, each with its own visibility rules:

1. **Public Results**
   - wins/losses
   - ranks
   - awards
2. **Observed Performance**
   - styles
   - tendencies
   - kimarite usage
3. **Physical Attributes**
   - strength
   - balance
   - stamina
   - injury resilience
4. **Hidden States**
   - fatigue
   - injury risk
   - morale
5. **Institutional Factors**
   - finances (approximate)
   - governance risk
   - rivalry intensity
6. **Intent**
   - training focus
   - recruitment plans
   - succession planning

Each domain has different discoverability.

---

# PART III — SCOUTING SOURCES

## 4. Scouting Channels

### 4.1 Passive Observation (Default)

Automatically accumulates from:
- bouts watched
- repeated matchups
- time in same division

Produces:
- rough style classification
- basic strength/weakness impressions

Low precision, low cost.

---

### 4.2 Active Scouting

Player or AI assigns **scouting attention** to targets:
- individual rikishi
- rival stables
- divisions

Costs:
- money
- attention budget
- opportunity cost

Improves precision and reduces uncertainty.

---

### 4.3 Insider Signals (Rare)

Triggered by:
- shared lineage
- prior stable affiliation
- kōenkai overlap
- governance interactions

Produces **narrow but high‑confidence** signals.

Never complete information.

---

## 5. Scouting Investment Levels

| Level | Cost | Information Quality |
|---|---|---|
| None | ¥0 | Public only |
| Light | Low | ±30–40% confidence |
| Standard | Medium | ±15–25% |
| Deep | High | ±5–10% |

Exact values are hidden from player.

---

# PART IV — CONFIDENCE & UNCERTAINTY MODEL

## 6. Confidence Bands (Canonical)

Every non‑public stat is stored internally as:
```
trueValue
estimatedValue
confidenceRange
```

Player & AI see only:
- estimatedValue
- qualitative confidence (“low / medium / high”)

---

## 7. Confidence Evolution

Confidence improves when:
- same opponent faced repeatedly
- active scouting persists
- rivalry intensity increases

Confidence decays when:
- rikishi changes style
- long periods without observation
- major training shifts

---

## 8. Misinference (Not Random Lies)

The system never fabricates data.
However:
- small sample sizes bias estimates
- recent bouts overweight perception
- rivalry distorts interpretation

This creates believable misreads.

---

# PART V — FOG‑OF‑WAR RULES

## 9. What Is Always Hidden

The following are **never directly visible**:
- exact injury probability
- exact fatigue values
- exact morale
- AI decision weights
- governance thresholds
- numeric rivalry intensity

These must be inferred.

---

## 10. What Is Approximate

Displayed with bands or descriptors:
- physical attributes
- style dominance
- financial health of rivals
- succession risk
- scandal likelihood

---

## 11. What Is Public

Always exact:
- rank
- bout result
- awards
- sanctions issued
- closures & mergers

---

# PART VI — NPC AI & INFORMATION

## 12. AI Uses the Same Information Model

NPC AI:
- sees estimates, not true values
- has confidence bands
- can misinterpret trends
- is affected by rivalry bias

AI advantages come from **continuity**, not hidden data.

---

## 13. AI Scouting Behavior

AI managers allocate scouting based on:
- rivalry intensity
- upcoming promotion pressure
- past misreads
- risk tolerance profile

Poor AI choices lead to bad reads.

---

# PART VII — INTEGRATION WITH OTHER SYSTEMS

## 14. Training & Evolution

Hidden fatigue/injury risk:
- influenced by training intensity
- only inferred via performance drop or injuries

Scouting never reveals training plans directly.

---

## 15. Economy & Governance

- Financial stress is inferred via:
  - roster churn
  - kōenkai news
  - media tone
- Governance risk inferred via:
  - warning headlines
  - sanctions
  - council scrutiny notices

Exact thresholds remain hidden.

---

## 16. Rivalries & Narrative

Rivalries:
- accelerate information gain
- increase overconfidence risk
- amplify narrative framing

Media may distort perception without lying.

---

# PART VIII — UI & PLAYER EXPERIENCE

## 17. UI Presentation Rules

UI must:
- show ranges, not absolutes
- use language (“appears strong in belt fights”)
- avoid numeric min/max bars
- surface uncertainty explicitly

---

## 18. Information Tooltips

Tooltips explain:
- why info is uncertain
- how to improve confidence
- recent evidence influencing estimate

---

# PART IX — LONG‑TERM MEMORY

## 19. Knowledge Persistence

- Observed knowledge persists across seasons
- Confidence decays slowly
- Journals record *what was believed*, not just what was true

This allows historical misreads.

---

# PART X — DETERMINISM & SAFETY

## 20. Determinism Contract

Given:
- same world seed
- same scouting actions
- same outcomes

All information states are identical.

No RNG lies.

---

## 21. Canon One‑Liners

- **On scouting:**  
  > “You never know the truth — only what the ring has allowed you to see.”

- **On fog‑of‑war:**  
  > “Institutions fail not from ignorance, but from believing they know enough.”

---

End of Scouting, Information & Fog‑of‑War System v1.0
