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
