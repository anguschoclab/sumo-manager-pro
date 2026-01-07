# Stable Lords — Institutional Interaction Contract v1.0 (Definitive)

Date: 2026-01-06  
Status: Canonical, verbose, implementation-grade  
Scope: This document defines the **explicit interaction contracts** between the three highest-order systems in Stable Lords:

1. **Institutional Economy & Governance Canon v2.0**
2. **Governance V1.3 (Council, Sanctions, Media, UI)**
3. **NPC Manager AI System v1.2 (Rivalries Integrated)**

This document exists to:
- prevent systemic drift
- make execution order unambiguous
- define shared objects and stacking rules
- clarify perception vs visibility
- ensure determinism across all layers

If a rule is ambiguous elsewhere, **this document resolves it**.

---

## 1. Why This Contract Exists

Stable Lords is no longer a collection of systems.
It is a **stacked institutional simulation**.

Without a binding interaction contract:
- AI intent can diverge from governance outcomes
- media effects can double-apply or vanish
- rivalry bias can accidentally become RNG
- UI can expose information NPCs should not have

This document locks the joints.

> Institutions fail not from rules, but from unclear interfaces.

---

## 2. System Layering (Authoritative Order)

From lowest to highest authority:

1. **Combat Engine**
2. **Rikishi Evolution & Training**
3. **NPC Manager AI (decision generation)**
4. **Economy System**
5. **Scandal Accumulation**
6. **Governance (Council Arbitration)**
7. **Media & Narrative**
8. **Player UI**

Higher layers may override outcomes of lower layers.  
Lower layers never override higher layers.

---

## 3. Deterministic Tick Order

### 3.1 Weekly Tick (Primary)

1. NPC AI evaluates current state
2. NPC AI issues decisions (training focus, spending, recruitment intent)
3. Economy applies weekly costs
4. Runway recalculated
5. Scandal checks evaluated
6. Governance triggers checked
7. UI warnings updated

---

### 3.2 Monthly Tick

1. Salaries & allowances paid
2. Kōenkai contributions applied
3. Loan repayments processed
4. Oyakata subsidies evaluated
5. Media follow-ups generated
6. Governance restrictions revalidated

---

### 3.3 Bout Resolution

1. Combat resolves
2. Kenshō applied
3. Rikishi rivalry state updated
4. Prestige updated (micro)
5. Media event queued (if threshold crossed)

---

### 3.4 Basho-End Resolution

1. Banzuke changes applied
2. Awards & trophies granted
3. Prestige decay applied
4. Scandal decay applied
5. Governance review pass
6. Media retrospectives generated
7. Permanent history logs written

---

## 4. Shared Object Contracts (Canonical)

### 4.1 Restriction Object

Used by:
- Governance
- Loan strings
- Sanctions

```ts
Restriction {
  id: string
  source: "loan" | "council" | "sanction"
  scope: "beya" | "oyakata" | "rikishi"
  type: "recruitment_ban" | "foreign_slot_lock" | "upgrade_lock" | "merger_block"
  severity: 1–5
  expiresAt?: TickID
}
```

Stacking rules:
- Higher severity overrides lower
- Same-type restrictions do not duplicate
- Council-issued restrictions always supersede loan-issued ones

---

### 4.2 Governance Ruling

```ts
GovernanceRuling {
  id: string
  trigger: string
  decision: string
  sanctions: Sanction[]
  restrictions: Restriction[]
  effectiveTick: TickID
}
```

Immutable once issued.

---

### 4.3 Media Event

```ts
MediaEvent {
  id: string
  severity: 1–5
  tone: "muted" | "critical" | "investigative" | "historic"
  linkedRuling?: GovernanceRulingID
}
```

Media events never exist without a source.

---

### 4.4 Rivalry State

```ts
RivalryState {
  entityA
  entityB
  tier: "background" | "recognized" | "heated" | "bitter" | "defining"
  trend: "cooling" | "stable" | "escalating"
}
```

Numeric intensity is internal only.

---

## 5. Rivalry ↔ Governance Interaction Rules

Rivalry:
- **does not trigger governance alone**
- **does modify tolerance thresholds**

Canonical effects:
- Heated+: increases scrutiny weight by +1 tier
- Bitter+: accelerates sanction escalation by one step *when already triggered*
- Defining: biases merger outcomes harsher

Rivalry never creates new sanctions by itself.

---

## 6. Rivalry ↔ Media Interaction Rules

- Rivalry increases media severity by +1 tier
- Rivalry increases headline frequency
- Rivalry never invents events

Media amplification:
- affects prestige decay rate
- affects kōenkai decay rate
- does not directly affect combat

---

## 7. AI ↔ Governance Contract

NPC AI:
- reads **active restrictions**
- reads **governance status**
- reads **qualitative scandal tier**
- never sees numeric thresholds

AI must comply with:
- recruitment bans
- foreign-slot locks
- merger blocks

Non-compliance is impossible.

---

## 8. AI ↔ Media Contract

NPC AI perceives:
- tone of coverage
- escalation trend
- identity of rival involved

NPC AI does **not** perceive:
- exact prestige deltas
- internal decay multipliers

Media affects:
- risk tolerance
- succession urgency
- willingness to accept loans

---

## 9. Visibility Rules (Player vs NPC)

| Information | Player | NPC |
|---|---|---|
| Numeric prestige | Partial | No |
| Scandal tier | Yes (qualitative) | Yes |
| Scandal score | No | No |
| Rivalry tier | Yes | Yes |
| Rivalry numeric | No | No |
| Upcoming escalation warning | Yes | Yes (qualitative) |

No actor has omniscience.

---

## 10. Stacking & Escalation Rules

- Multiple sanctions stack by severity
- Restrictions persist until expiry or lifted by council
- Loan strings stack with council restrictions
- Council may convert loan strings into sanctions

Escalation is **stepwise, never skipping**.

---

## 11. Failure & Override Resolution

When conflicts occur:
1. Governance overrides economy
2. Economy overrides AI intent
3. Restrictions override AI decisions
4. Media reflects final outcome only

No retroactive changes.

---

## 12. Determinism Contract

Given:
- same seed
- same choices
- same outcomes

All interactions, rulings, media, and UI states are identical.

---

## 13. Canon One-Liners

- **On interaction:**  
  > “Systems do not fail — interfaces do.”

- **On determinism:**  
  > “Nothing surprising happens. Only consequences.”

---

End of Institutional Interaction Contract v1.0
