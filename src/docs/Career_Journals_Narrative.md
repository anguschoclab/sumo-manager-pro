# Stable Lords — Career Journals, Historical Memory & Narrative Rendering System v1.0 (Canonical)

Date: 2026-01-06  
Status: Canonical, verbose, implementation-grade  
Scope: This document defines how **events become memory and memory becomes story** in Stable Lords. It harmonizes and extends:
- Banzuke, Scheduling & Basho Awards v1.1
- Governance (Scandals, Media, Decisions)
- Rivalries & NPC AI perception
- World Identity & ID contracts

It is the authoritative system for:
- Career Journals (rikishi, oyakata, beya)
- Immutable historical records
- Narrative rendering & headline phrase engine
- Long-term legacy, comparison, and retrospectives

If an event matters, it must appear here.

---

# PART I — DESIGN PHILOSOPHY

## 1. Why Journals & Narrative Exist

Stable Lords is not a match simulator.
It is a **career and institutional memory simulator**.

This system ensures:
- nothing important disappears
- success is contextual, not just numeric
- institutions remember embarrassment as well as glory
- players can *read* history, not just infer it

> Numbers tell you what happened.  
> Journals tell you what it meant.

---

# PART II — HISTORICAL MEMORY MODEL

## 2. Immutable Event Spine

Every significant system emits **events**, not stories.

Sources include:
- Bouts & basho results
- Basho awards & trophies fileciteturn10file0
- Promotions & demotions
- Rivalry escalations
- Governance rulings
- Scandals & sanctions
- Mergers & closures
- Shikona changes
- Retirements & succession

Events are:
- immutable
- timestamped
- ID-referenced
- never deleted

---

## 3. Event Object (Canonical)

```ts
HistoryEvent {
  id: string
  sourceSystem: string
  date: BashoID | WeekID
  entityIds: string[]
  type: string
  payload: object
}
```

Events are raw facts.  
They do **not** contain prose.

---

# PART III — CAREER JOURNALS

## 4. Journal Types

There are **three parallel journals**, all built from the same event spine.

### 4.1 Rikishi Career Journal
Tracks:
- debut
- promotions/demotions
- basho records
- awards & trophies
- notable bouts (upsets, playoffs)
- rivalry chapters
- shikona changes
- injuries & comebacks
- retirement

---

### 4.2 Oyakata Career Journal
Tracks:
- rikishi career summary
- kabu acquisition
- stable founding / inheritance
- governance actions
- scandals & sanctions
- mergers or closures overseen
- succession outcomes

---

### 4.3 Beya Institutional Journal
Tracks:
- founding
- prestige peaks & collapses
- yusho counts
- sanshō totals
- famous alumni
- rivalries
- governance rulings
- mergers / closure (if applicable)

Journals persist after death or closure.

---

## 5. Journal Entry Generation Rules

Journal entries are:
- derived from events
- deterministic
- milestone-based (not spam)

Example triggers:
- first top-division win
- first sanshō
- yusho
- rivalry reaches “bitter”
- governance sanction level ≥ 2

---

## 6. Journal Entry Object

```ts
JournalEntry {
  id: string
  journalType: "rikishi" | "oyakata" | "beya"
  date: BashoID | WeekID
  headlineKey: string
  relatedEvents: HistoryEventID[]
}
```

The entry references narrative keys, not raw text.

---

# PART IV — NARRATIVE RENDERING & HEADLINE ENGINE

## 7. Separation of Fact and Language

Narrative rendering is **strictly layered**:

1. Facts (HistoryEvents)
2. Meaning (JournalEntries)
3. Language (Headline Engine)

This prevents:
- contradictions
- randomness
- tone drift

---

## 8. Headline Phrase Engine

### 8.1 Headline Keys

Each journal entry references a **headline key**, e.g.:
- `YUSHO_UPSET`
- `DOUBLE_SANSHO`
- `RIVALRY_ESCALATION`
- `GOVERNANCE_SANCTION`
- `STABLE_CLOSURE`

---

### 8.2 Phrase Pools

Each key maps to a **deterministic phrase pool** segmented by:
- tone (neutral, celebratory, critical, historic)
- perspective (rikishi, beya, institution)
- era preset (optional)

Example:
```
YUSHO_UPSET / celebratory:
- "{name} shocks the division with a championship run"
- "Against all expectations, {name} lifts the Emperor’s Cup"
```

Selection is deterministic based on event ID hash.

---

## 9. Tone Determination

Tone is determined by:
- event severity
- rivalry involvement
- scandal state
- prestige delta

Media tone rules align with Governance v1.3.

---

## 10. Anti-Repetition & Readability

The engine enforces:
- phrase cooldowns
- synonym rotation
- escalation-only repetition (same rivalry, higher stakes)

This avoids headline spam.

---

# PART V — INTEGRATION WITH EXISTING SYSTEMS

## 11. Banzuke & Awards Integration

- All awards emit HistoryEvents
- Sanshō, yusho, and trophies create JournalEntries fileciteturn10file0
- Multi-award basho create compound entries
- Awards unlock retrospective comparisons

---

## 12. Rivalry System Integration

- Rivalry creation, escalation, and resolution emit events
- Journals group rivalry arcs into chapters
- Headline tone escalates with rivalry tier

---

## 13. Governance & Scandals Integration

- Every ruling emits a HistoryEvent
- Sanction escalation creates narrative gravity
- Closure & mergers generate historic retrospectives

No governance action is silent.

---

## 14. NPC AI Interaction

NPC AI:
- reads journal summaries, not raw numbers
- remembers humiliation and success via journals
- weighs rival success more heavily if journalized

This explains long-term grudges.

---

# PART VI — PLAYER UX & DISCOVERY

## 15. Journal UI Principles

Players can:
- browse journals chronologically
- filter by theme (awards, rivalries, governance)
- jump from headline → underlying events
- compare careers across eras

Players cannot:
- edit history
- suppress scandals
- rewrite closures

---

## 16. Discovery Timing

Not all journal entries are shown immediately:
- minor entries batch
- major entries surface instantly
- retrospectives unlock after milestones

This keeps pacing readable.

---

# PART VII — LONG-TERM MEMORY & ERAS

## 17. Retrospectives & Comparisons

The system supports:
- “Greatest Yokozuna of the Era”
- “Most Turbulent Stable”
- “Defining Rivalries”

These are **queries over journals**, not special cases.

---

## 18. Archival Rules

- Closed stables remain browsable
- Retired rikishi remain searchable
- Shikona aliases resolve to same RikishiID

History is never lost.

---

# PART VIII — DETERMINISM & SAFETY

## 19. Determinism Contract

Given identical:
- world seed
- outcomes
- choices

Journal entries and headlines are identical.

---

## 20. Canon One-Liners

- **On journals:**  
  > “Careers are not records — they are stories that survived scrutiny.”

- **On narrative:**  
  > “The game never invents drama. It remembers it.”

---

End of Career Journals & Narrative Rendering System v1.0
