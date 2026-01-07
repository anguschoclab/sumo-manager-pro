# Stable Lords — UI Screen Map & Player Information Architecture v1.0 (Final Canon)

Date: 2026-01-06  
Status: Canonical, final-layer, implementation-grade  
Scope: This document defines **every player-facing screen, panel, dashboard, and navigation flow** in Stable Lords, and binds them to the underlying systems, observability rules, and narrative contracts.

This is the **capstone document**.  
No new mechanics are introduced here — only *how the simulation is surfaced to the player*.

If information presentation is ambiguous elsewhere, **this document decides**.

---

# PART I — UI DESIGN PHILOSOPHY

## 1. Core Principles

The UI must:
- respect fog-of-war at all times
- surface uncertainty explicitly
- privilege trends over absolutes
- make consequences legible
- never overwhelm in a single view

> The UI does not explain the simulation.  
> It reveals just enough of it to be dangerous.

---

## 2. Information Hierarchy

Information is always layered as:
1. **Headline / Signal**
2. **Context / Comparison**
3. **Detail / Evidence**

The player must *opt in* to depth.

---

# PART II — GLOBAL NAVIGATION

## 3. Primary Navigation Tabs

Top-level screens:

1. **Stable**
2. **Banzuke**
3. **Basho**
4. **Rikishi**
5. **Rivalries**
6. **Scouting**
7. **Economy**
8. **Governance**
9. **History**
10. **World**

No screen is redundant.

---

# PART III — SCREEN-BY-SCREEN SPECIFICATION

## 4. Stable Overview Screen

### Purpose
The player’s institutional cockpit.

### Displays
- beya prestige (qualitative + trend)
- kōenkai strength (banded)
- financial runway (weeks, banded)
- active restrictions / sanctions
- key rivalries
- upcoming risks (warnings only)

### Prohibited
- exact yen amounts (unless own beya)
- hidden governance thresholds

---

## 5. Banzuke Screen

### Purpose
Competitive context.

### Displays
- full banzuke
- promotion/demotion highlights
- rival markers
- award icons (yūshō, sanshō)

### Interaction
- click rank → rikishi profile
- filter by stable, rivalry, division

---

## 6. Basho Screen

### Purpose
Moment-to-moment competition.

### Displays
- daily torikumi
- bout results
- kenshō count
- media headlines

### Combat Logs
- only public disclosure fields (per Observability Contract)

---

## 7. Rikishi Profile Screen

### Purpose
Career and capability overview.

### Displays
- shikona + aliases
- rank history
- primary style (public)
- inferred archetype (confidence-tagged)
- physical attributes (bands)
- career journal highlights
- rivalries

### Hidden
- exact fatigue
- exact injury risk
- growth ceilings

---

## 8. Rivalries Screen

### Purpose
Narrative tension map.

### Displays
- active rivalries (rikishi / stable / oyakata)
- rivalry tier (qualitative)
- recent events
- historical highlights

### Interaction
- click rivalry → journal arc

---

## 9. Scouting Screen

### Purpose
Information control.

### Displays
- current scouting targets
- confidence levels
- recent evidence
- decay warnings

### Interaction
- allocate scouting effort
- compare estimates over time

---

## 10. Economy Screen

### Purpose
Institutional solvency.

### Displays
- income streams (bands)
- expense categories
- runway projection
- supporter trends
- loan obligations

### Warnings
- stress thresholds
- upcoming repayment risk

---

## 11. Governance Screen

### Purpose
Institutional constraint awareness.

### Displays
- current governance status
- sanctions & restrictions
- council warnings
- kabu state
- decision history ledger

### Tone
Formal, sober, non-alarmist.

---

## 12. History Screen

### Purpose
Memory and legacy.

### Displays
- journals (rikishi / beya / oyakata)
- filters by theme
- milestone timelines
- retrospectives

History is immutable.

---

## 13. World Screen

### Purpose
Macro context.

### Displays
- stable map
- prestige distribution
- era indicators
- recent closures / mergers

---

# PART IV — CROSS-CUTTING UI RULES

## 14. Warnings & Alerts

Warnings must:
- be explicit
- state cause and consequence
- never surprise the player

No hidden fail states.

---

## 15. Tooltips & Explanations

Every banded value includes:
- what it represents
- why it’s uncertain
- how it might change

---

## 16. Color & Icon Semantics

- Color encodes *direction*, not magnitude
- Icons encode *category*, not severity
- Severity conveyed via language

---

## 17. Player vs NPC Symmetry

The UI never exposes:
- information NPCs don’t also infer
- engine truth
- hidden thresholds

Fairness is visible.

---

# PART V — FTUE UI CONSTRAINTS

## 18. Progressive Disclosure

During FTUE:
- hide advanced tabs (Governance, World)
- surface warnings earlier
- delay irreversible actions

Nothing is disabled — only deferred.

---

## 19. FTUE Completion Signal

After first basho:
- governance tab unlocks fully
- historical comparisons activate
- rivalry arcs fully visible

---

# PART VI — TECHNICAL CONTRACT

## 20. UI Data Inputs

UI consumes only:
- estimated states
- journal entries
- public logs
- governance rulings

UI may never query engine truth.

---

## 21. Determinism Contract

Given:
- same seed
- same actions

UI output is identical.

---

## 22. Canon One-Liners

- **On UI:**  
  > “The interface is not a dashboard — it is a lens.”

- **On fairness:**  
  > “If the player can see it, the world can see it.”

- **On mastery:**  
  > “Understanding comes not from more data, but from better questions.”

---

End of UI Screen Map & Player Information Architecture v1.0
