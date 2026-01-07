# Stable Lords — Sumo Play-by-Play (PBP) System v2.0  
## Definitive Canon: Narrative Bout Rendering, Crowd, Memory & Broadcast Tone

Date: 2026-01-06  
Status: **Definitive Canon**  
Supersedes:
- PBP v1.0 (core narrative flow)
- PBP v1.1 (special rulings, commentator voices)
- PBP v1.2 (crowd reactions, regional broadcast tone)
- PBP v1.3 (crowd memory & venue identity)

This document **curates, harmonises, and preserves all features** from prior PBP documents into a single authoritative specification.  
If a PBP-related question arises, **this document decides**.

---

## 1. Purpose & Design Intent

The Play-by-Play system exists to ensure that sumo bouts in Stable Lords are:
- culturally authentic
- narratively legible
- emotionally grounded
- mechanically faithful
- remembered, not logged

> “The bout is resolved by the engine.  
> It is remembered by the hall.”

---

## 2. Core Narrative Rules (Player-Facing)

### 2.1 Continuous Flow
- Bouts are presented as **one flowing narrative**
- No visible mechanical phases
- No numbers, meters, or probabilities

### 2.2 Language Priorities
Narration emphasizes:
1. Position (center → edge)
2. Balance (stable → compromised)
3. Intent (pressing, waiting, adjusting)
4. Turning points (hesitation, grip, reset failure)

### 2.3 Ritual Anchors
Every bout must reference:
- the dohyo
- the gyoji
- the formality of the contest

---

## 3. Commentator Voice Style Matrix

Voice is selected deterministically based on:
- era preset
- broadcaster identity
- bout importance (rank, day, stakes)

### 3.1 Voice Styles

**Formal (Traditional / NHK-like)**  
Restrained, precise, ceremonial.

**Dramatic (Late Basho / High Stakes)**  
Heightened emotion, crowd-aware, decisive beats emphasized.

**Understated (Early Basho / Analytical)**  
Quiet, observational, implication-driven.

Voice affects cadence and adjective density only.

---

## 4. Regional Broadcast Tone Layer

Regional tone overlays voice style.

### 4.1 Venue Profiles

**Tokyo (Ryōgoku)**  
- authoritative
- historically aware
- restrained crowd language

**Osaka / Nagoya**  
- warmer
- momentum-focused
- emotionally responsive

**Fukuoka (Kyushu)**  
- lively
- intimate
- crowd personality foregrounded

Regional tone never alters outcomes.

---

## 5. Crowd Reaction System

### 5.1 Hidden Crowd State
The engine tracks:
- anticipation
- tension
- surprise
- release

These are never exposed numerically.

### 5.2 Reaction Beats
Narrative expressions include:
- murmurs
- gasps
- rising noise
- eruptions
- silence

Silence is a valid and powerful reaction.

---

## 6. Crowd Memory System (Persistent)

### 6.1 Scope
Crowd memory is tracked **per venue**, not globally.

Venues remember:
- rikishi
- stables
- notable oyakata

### 6.2 Memory Dimensions (Hidden)
- favorability
- trust
- expectation
- overexposure

Memory decays slowly and unevenly.

### 6.3 Narrative Effects
Crowd memory influences:
- timing of reactions
- warmth or skepticism of language
- pressure framing

Example:
> “The hall responds early—this crowd remembers him.”

---

## 7. Special Ruling Narrative Branches

Special rulings are rare and heavy with ritual.

### 7.1 Mono-ii
- gyoji hesitation
- judges enter
- hall falls quiet
- decision delivered formally

### 7.2 Torinaoshi
- treated as continuation
- fatigue implied
- narration tighter and more urgent

### 7.3 Mizui-iri
- ritualistic pause
- respectful quiet
- post-break stiffness emphasized

---

## 8. Backend Fidelity (Hidden)

Internally, Combat Engine V3 resolves:
1. Tachiai initiative
2. Stance & grip
3. Momentum ticks
4. Fatigue & balance
5. Position drift
6. Finisher window
7. Counter check
8. Kimarite selection
9. Special rulings

Narrative is generated **after** resolution.

---

## 9. Determinism Contract

Given:
- same world seed
- same bout state
- same venue
- same history

The same:
- voice
- crowd reactions
- ruling branches
- PBP text

is produced.

No RNG flavor.  
No mood dice.

---

## 10. Sample Definitive PBP Bout

**Honbasho:** Kyushu Basho  
**Day:** 13  
**Division:** Makuuchi  
**Venue:** Fukuoka  
**Voice Style:** Dramatic

**East Maegashira 3 — Kiryuzan**  
**West Komusubi — Hoshitora**

---

> “Day Thirteen here in Fukuoka, and the crowd is already alive.”  
> “Kiryuzan steps onto the dohyo—greeted warmly by this hall.”  
> “Hoshitora follows, expression tight.”  
> “The gyoji calls them forward.”  
> “They crouch at the shikiri-sen… no hesitation.”  
> “The fan drops—*tachiai!*”  
> “A violent collision! The sound echoes!”  
> “Hoshitora drives forward—the crowd responds!”  
> “Kiryuzan gives ground but stays balanced.”  
> “A murmur spreads—he’s found the belt!”  
> “They drift toward the edge—voices rising!”  
> “Hoshitora hesitates—just a moment!”  
> “Kiryuzan surges!”  
> “At the straw—out!”  
> “The hall erupts!”  

**Winner:** **Kiryuzan**  
**Kimarite:** **Yorikiri**

> “What a moment in Kyushu! Patience, balance, and pressure carry Kiryuzan through.”

---

## 11. Integration with Other Systems

- **Scouting:** phrasing reinforces inferred tendencies
- **Rivalries:** history amplifies crowd memory
- **Journals:** decisive lines become entries
- **Media:** headlines borrow crowd language
- **Governance:** scandals shift memory sharply

---

## 12. Canon One-Liners

- “The ring decides the winner. The hall decides the memory.”
- “Some venues never forget.”
- “Silence is not absence. It is judgment.”

---

**End of Sumo Play-by-Play System v2.0 — Definitive Canon**
