# Stable Lords — Information Surfaces & Observability Contract v1.0  
## Fog-of-War, Scouting, Logs, UI & AI Perception (Definitive)

Date: 2026-01-06  
Status: Canonical, implementation-grade  
Scope: This document defines **what is knowable, by whom, when, and how** in Stable Lords.  
It is the authoritative contract binding together:

- Combat Engine V3
- Rikishi Evolution & Training
- Scouting / Fog-of-War
- NPC Manager AI (v1.2)
- Beya Management
- Governance & Media
- UI presentation rules

If information visibility is unclear elsewhere, **this document decides**.

---

## 1. Why an Observability Contract Exists

Stable Lords is a deterministic simulation with **hidden state**.
Without a strict observability contract:
- players accidentally gain omniscience
- NPC AI appears to cheat
- scouting loses value
- narrative collapses into math

> The simulation knows everything.  
> Actors know only what they have earned.

---

## 2. Core Principles

1. **Engine Truth ≠ Player Knowledge**
2. **NPC AI uses the same knowledge layer as players**
3. **No system may bypass observability rules**
4. **Uncertainty is explicit, never fake**
5. **Nothing random lies**

---

## 3. Information Layers (Authoritative)

Every variable exists simultaneously in four layers:

| Layer | Description |
|---|---|
| Engine Truth | Exact internal value |
| Observed Data | Logs & outcomes |
| Estimated State | Scouted interpretation |
| Presented View | UI language & bands |

Only the engine accesses layer 1.

---

## 4. Observability Matrix (Key Variables)

### 4.1 Physical & Combat Attributes

| Attribute | Engine | Player | NPC | Acquisition |
|---|---|---|---|---|
| Strength | Exact | Estimate | Estimate | Scouting |
| Balance | Exact | Estimate | Estimate | Scouting |
| Stamina | Exact | Estimate | Estimate | Scouting |
| Fatigue | Exact | Hidden | Hidden | Inferred only |
| Injury Risk | Exact | Hidden | Hidden | Inferred |
| Weight / Height | Exact | Public | Public | Visible |

---

### 4.2 Style & Technique

| Attribute | Engine | Player | NPC | Acquisition |
|---|---|---|---|---|
| Primary Style | Exact | Public | Public | Observation |
| Archetype | Exact | Inferred | Inferred | Long-term |
| Kimarite Tendency | Exact | Estimate | Estimate | Bout logs |
| Hidden Adaptations | Exact | Hidden | Hidden | Never |

---

### 4.3 Training & Development

| Attribute | Engine | Player | NPC | Acquisition |
|---|---|---|---|---|
| Training Focus | Exact | Private | Private | Direct control |
| Training Intensity | Exact | Private | Private | Direct |
| Injury Load | Exact | Hidden | Hidden | Inferred |
| Growth Potential | Exact | Inferred | Inferred | Long-term |

---

### 4.4 Institutional & Economic Intel

| Attribute | Engine | Player | NPC | Acquisition |
|---|---|---|---|---|
| Exact Funds | Exact | Private | Private | Direct |
| Rival Funds | Exact | Band | Band | Media/Scouting |
| Debt | Exact | Private | Private | Direct |
| Rival Debt | Exact | Band | Band | Media |
| Kōenkai Strength | Exact | Band | Band | Narrative |
| Governance Risk | Exact | Qualitative | Qualitative | Media |

---

### 4.5 Governance & Sanctions

| Attribute | Engine | Player | NPC | Acquisition |
|---|---|---|---|---|
| Scandal Score | Exact | Hidden | Hidden | Never |
| Scandal Tier | Derived | Public | Public | Governance |
| Sanction State | Exact | Public | Public | Governance |
| Thresholds | Exact | Hidden | Hidden | Never |

---

## 5. Combat Log Disclosure Policy

Combat Engine V3 produces rich logs. These are filtered as follows:

### 5.1 Public Broadcast Logs
- bout result
- kimarite used
- match duration
- win/loss streak

### 5.2 Scouting Logs (Requires Observation)
- stance transitions
- repeated technique patterns
- endurance signals (vague)

### 5.3 Internal-Only Logs
- exact fatigue values
- injury rolls
- probability tables
- AI evaluation weights

These are never exposed.

---

## 6. Scouting → Estimate Pipeline (Binding)

1. Raw observation collected
2. Sample size evaluated
3. Confidence band adjusted
4. Rivalry modifier applied
5. Estimate stored
6. UI language generated

No step may be skipped.

---

## 7. Rivalry Modifiers (Deterministic)

| Rivalry Tier | Confidence Gain | Bias Risk |
|---|---|---|
| None | Normal | None |
| Recognized | +10% | Low |
| Heated | +20% | Medium |
| Bitter | +30% | High |
| Defining | +40% | Very High |

Bias affects interpretation, not truth.

---

## 8. NPC AI Compliance Rules

NPC AI:
- cannot read engine truth
- cannot bypass scouting
- cannot see hidden layers
- is subject to same confidence decay

Any AI decision must be explainable from perceived state.

---

## 9. UI Presentation Rules

UI must:
- use qualitative bands (“appears strong”)
- show confidence explicitly
- explain *why* info is uncertain
- avoid numeric precision

Forbidden:
- exact bars
- hidden stat leaks
- probability percentages

---

## 10. Long-Term Memory & Misbelief

Journals record:
- what was believed
- what was observed
- what later proved wrong

This enables:
- historical misreads
- tragic careers
- institutional blindness

---

## 11. Anti-Cheating & Testing Hooks

For debugging:
- engine truth may be logged
- must be behind dev flag
- never used by AI logic

---

## 12. Determinism Contract

Given:
- same seed
- same scouting actions
- same observations

All estimates, confidence bands, and UI output are identical.

---

## 13. Canon One-Liners

- **On observability:**  
  > “The ring reveals only what it must.”

- **On knowledge:**  
  > “Institutions fail because they mistake familiarity for understanding.”

---

End of Information Surfaces & Observability Contract v1.0
