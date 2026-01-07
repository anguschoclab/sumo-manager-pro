# Stable Lords — Governance V1.3  
## Kabu, Council, Sanctions, Scandals, Media, UI, Mergers & Closures (Canonical)

Date: 2026-01-06  
Status: Canonical, verbose, implementation-ready  
Supersedes: Governance V1.1 (Kabu, Council, Scandals, Mergers & Closures)

Scope: This document defines the **complete governance layer** of Stable Lords and explicitly explains
**how governance interacts with economy, AI, narrative, and the beya lifecycle**, while adding:

- **Scandal Narrative & Media Layer**
- **Governance UI & Decision History**

Governance is the *institutional nervous system* of the simulation.

---

## 1. Design Philosophy (Why Governance Exists)

Governance is not balance tuning.
Governance is not flavor text.
Governance is **institutional pressure made visible**.

Its role is to:
- arbitrate conflicts between sport, money, and legitimacy
- ensure failure has memory
- ensure survival has cost
- prevent “silent death” or unexplained punishment

> The council does not decide who wins. It decides who is allowed to continue.

---

## 2. System Interaction Overview (Big Picture)

Governance sits **above** all other systems and consumes their outputs.

### Inputs into Governance
- Economy system (cash, debt, subsidies, loans)
- Beya system (roster health, staffing, facilities)
- Training system (injury patterns, welfare risk)
- NPC Manager AI (behavior under pressure)
- Scandal system (accumulated violations)
- Narrative/media signals (public exposure)

### Outputs from Governance
- sanctions
- restrictions
- forced structural change
- mergers
- closures
- kabu revocation or escrow
- permanent historical rulings

Governance decisions are **terminal overrides**.

---

## 3. Kabu System (Recap, with Interaction Notes)

### 3.1 Kabu as a Constraint
- Finite global pool
- Required to operate a beya
- Revocable under sanction
- Non-income-generating

### 3.2 Interaction with Other Systems
- Economy: kabu loss invalidates all loans and forces resolution
- AI: managers track kabu risk and plan succession
- Narrative: kabu disputes are headline events
- UI: kabu status is always visible for a beya

---

## 4. Council Decision Engine (Deterministic Core)

### 4.1 Trigger Sources
- Insolvency states
- Missed loan repayments
- Scandal score thresholds
- Succession failures
- Benefactor pressure
- Repeated welfare violations

### 4.2 Deterministic Arbitration Pipeline
Every ruling follows this exact order:

1. Trigger registered
2. Full state snapshot captured
3. Applicable rules evaluated
4. Mandatory action selected
5. Secondary effects applied
6. Ruling logged permanently
7. Media narrative emitted
8. UI updated

There is **no discretion** and **no randomness**.

---

## 5. Sanctions Ladder (Integrated View)

Sanctions accumulate and stack.

| Level | Name | Core Effect | System Interaction |
|---|---|---|---|
| 1 | Warning | Prestige loss | Media coverage begins |
| 2 | Fine | Cash removal | Kōenkai trust drop |
| 3 | Restriction | Recruitment / foreign-slot ban | AI forced conservative |
| 4 | Forced Change | Staff or oyakata removal | Succession pressure |
| 5 | Structural | Merger or closure | World topology change |

Sanctions may escalate faster under scandal pressure, but never skip logic.

---

## 6. Scandals & Ethics System (Extended)

### 6.1 Scandal as Accumulated State
Scandals are **emergent outcomes**, not events.

Each beya tracks:
- scandalScore (hidden)
- scandalCategory flags
- time since last violation

### 6.2 Cross-System Triggers
- Economy: hidden insolvency, abusive subsidies
- Training: repeated injury spikes without mitigation
- AI: ignoring restrictions or warnings
- Loans: breach of benefactor conditions

Scandal score only increases when **multiple systems corroborate failure**.

---

## 7. Scandal Narrative & Media Layer (NEW)

### 7.1 Purpose
The media layer:
- translates governance state into **player-readable stories**
- ensures consequences are *felt*, not just applied
- reinforces institutional memory

This layer **never invents facts**.
It only consumes governance rulings and system logs.

---

### 7.2 Narrative Objects

```ts
MediaEvent {
  id: string
  category: "financial" | "ethical" | "institutional"
  severity: 1–5
  beyaId: string
  summary: string
  rulingRef: GovernanceRulingID
}
```

---

### 7.3 Media Escalation Rules
- First warning → muted coverage
- Repeated sanctions → investigative tone
- Structural action → historic headline
- Closure → retrospective narrative

Media tone is deterministic based on severity.

---

### 7.4 Interaction with Other Systems
- Prestige: media accelerates decay
- Kōenkai: media reduces supporter strength
- Recruitment: media lowers candidate quality
- AI: managers alter risk tolerance under scrutiny

---

## 8. Governance UI & Decision History (NEW)

### 8.1 Governance Panel (Per Beya)

The UI must show:
- current governance status
- active sanctions
- kabu state
- active loans and restrictions
- scandal warning tier (qualitative)

Never show:
- numeric scandalScore
- internal thresholds

---

### 8.2 Decision History Ledger

Each beya has a permanent, immutable log:

```ts
GovernanceRuling {
  id: string
  date: BashoID | WeekID
  trigger: string
  decision: string
  consequences: string[]
}
```

This ledger:
- cannot be erased
- follows the beya through mergers
- is visible to the player
- is used by narrative comparisons

---

### 8.3 Player Warnings & Affordances
Before a governance action:
- UI shows **clear warnings**
- highlights what will happen next
- explains how to avoid escalation (if possible)

No surprise closures.

---

## 9. Stable Mergers (Governance-Aware)

### 9.1 Forced Merger Bias Under Scandal
- fewer eligible partners
- harsher roster trimming
- prestige transfer penalties
- stricter kabu control

### 9.2 Narrative Handling
Mergers generate:
- justification headlines
- legacy comparisons
- “what was lost” summaries

---

## 10. Forced Closures (Final Authority)

Closure is:
- irreversible
- logged permanently
- narratively contextualized

Closure triggers include:
- kabu loss
- scandalScore saturation
- repeated loan default
- council final ruling

---

## 11. Succession Under Governance Pressure

- Scandal-tainted stables face:
  - stricter successor vetting
  - blocked internal promotions
- External successors may be imposed
- Failure → merger or closure

Succession is never automatic.

---

## 12. NPC AI Interaction Summary

AI managers:
- read governance status
- change training, recruitment, spending
- plan earlier retirement under scrutiny
- may resign before forced removal

Different profiles respond differently, but rules are uniform.

---

## 13. Determinism Contract

Given the same:
- world seed
- decisions
- outcomes

Governance rulings, media narratives, and UI history are identical.

---

## 14. Canon One-Liners

- **On governance:**  
  > “You do not beat the council. You convince it you are worth keeping.”

- **On scandal:**  
  > “The scandal is not what happened — it is what was allowed to continue.”

- **On media:**  
  > “The media does not judge. It remembers.”

---

End of document.
