# Stable Lords — Sumo Play‑by‑Play (PBP) System v3.2  
## Ultimate Definitive Canon: Narrative, Ritual, Memory, Variety & Commerce

Date: 2026‑01‑06  
Status: **ULTIMATE DEFINITIVE CANON — FULL DETAIL, NON‑HIGH‑LEVEL**  
Supersedes:
- PBP v1.0
- PBP v1.1
- PBP v1.2
- PBP v1.3
- PBP v2.0
- PBP v2.1
- PBP v2.3
- PBP v3.0
- PBP v3.1

This document **fully and explicitly consolidates every PBP system feature, rule, constraint, and design ideal** defined across all prior Stable Lords PBP documents.

Nothing is summarized.
Nothing is implied.
Nothing is deferred.

If a question concerns **how a bout is presented, narrated, ritualized, remembered, or described**, this document governs.

---

## 1. System Authority & Role

The PBP system is the **sole narrative presentation authority** for sumo bouts.

It:
- renders deterministic Combat Engine V3 outcomes into cultural experience
- preserves sumo ritual, restraint, and institutional gravity
- creates long‑term memory through language
- teaches sumo implicitly without exposing mechanics

The PBP system **never influences**:
- bout outcomes
- AI decisions
- economy calculations
- governance logic

> The engine decides the bout.  
> The hall remembers it.  
> PBP gives it voice.

---

## 2. Binding Constraints (Hard Rules)

### 2.1 Narrative‑Only Surface
PBP output must NEVER:
- display numbers
- reference probabilities or rarity
- expose stats, tiers, weights, or ratings
- describe internal engine phases
- imply alternate outcomes

### 2.2 Determinism Contract
Given identical:
- world seed
- bout state
- venue
- crowd memory
- sponsor state
- phrase history

The generated PBP text **must be identical**.

No RNG prose.  
No stochastic applause.  
No drifting tone.

---

## 3. Narrative Flow Architecture

### 3.1 Continuous Flow Rule
A bout is rendered as **one uninterrupted narrative passage**.

The player never sees:
- phase headings
- timers
- meters
- mechanical state labels

Pauses, silence, and brevity are deliberate narrative tools.

---

### 3.2 Canonical Narrative Beats (Ordered, Optional)

1. Venue & day framing  
2. Rank / stake context  
3. Ring entrance rituals  
4. Shikiri tension  
5. Tachiai impact  
6. Control establishment  
7. Momentum shift(s)  
8. Decisive action  
9. Gyoji ruling  
10. Winning move (kimarite) emphasis  
11. Kenshō ceremony (if present)  
12. Immediate aftermath framing  

Omission of a beat is meaningful and deterministic.

---

## 4. Language Priority Model

Every sentence must map to at least one axis:

1. **Position** — center, drifting, edge, straw  
2. **Balance** — planted, wavering, scrambling  
3. **Intent** — pressing, waiting, adjusting  
4. **Turning Point** — hesitation, grip, angle break  

Forbidden language:
- numbers
- mechanical terms
- probability words
- rarity descriptors

---

## 5. Commentator Voice System

### 5.1 Deterministic Voice Selection
Voice is chosen once per bout based on:
- era preset
- broadcaster identity
- basho day
- rank & narrative stakes

Voice NEVER changes mid‑bout.

---

### 5.2 Voice Styles (Explicit)

**Formal (Traditional / NHK‑like)**  
- short declarative sentences  
- restrained emotion  
- ceremonial authority  

**Dramatic (Late Basho / High Stakes)**  
- rising cadence  
- heightened verbs  
- crowd foregrounded  

**Understated (Early Basho / Analytical)**  
- neutral phrasing  
- implication over emphasis  

Voice affects cadence and adjective density only.

---

## 6. Regional Broadcast Tone Overlay

Regional tone overlays voice and affects phrasing only.

- **Tokyo (Ryōgoku):** authoritative, historical, restrained  
- **Osaka / Nagoya:** warmer, momentum‑focused, reactive  
- **Fukuoka:** intimate, expressive, crowd‑forward  

Tone never alters facts or outcomes.

---

## 7. Ring Entrance & Ritual Layer

### 7.1 Ritual Eligibility
Entrance narration may appear when:
- bout is sekitori‑level
- rivalry or late‑basho stakes exist
- venue tone supports ritual emphasis

---

### 7.2 Ritual Elements (Selective)
- salt toss (shio‑maki)
- foot stamping
- towel handling
- posture & breathing
- eye contact
- crowd hush

Rules:
- concise
- atmospheric
- never padded
- never identical unless deterministically required

---

## 8. Crowd Reaction System

### 8.1 Hidden Crowd State
Tracked internally:
- anticipation
- tension
- surprise
- release

Derived from rank gap, rivalry, venue memory, and outcome shock.

---

### 8.2 Narrative Crowd Reactions
Expressed as:
- murmurs
- gasps
- rising noise
- eruptions
- silence

Silence is a deliberate narrative beat.

---

## 9. Persistent Crowd Memory System

### 9.1 Scope
Tracked **per venue**:
- rikishi
- stables
- notable oyakata

Memory is never erased — only diluted.

---

### 9.2 Memory Dimensions (Hidden)
- favorability
- trust
- expectation
- overexposure

Decay is slow and uneven.

---

### 9.3 Narrative Effects
Memory influences:
- timing of reactions
- warmth vs skepticism
- pressure framing

---

## 10. Special Ruling Narrative Branches

### Mono‑ii
- gyoji hesitation
- judges enter
- hall falls silent
- formal ruling delivered

### Torinaoshi
- continuation, not reset
- fatigue implied
- tighter narration

### Mizui‑iri
- ritual pause
- respectful quiet
- stiffness emphasized post‑break

---

## 11. Winning Move (Kimarite) Emphasis

Every bout MUST explicitly acknowledge the winning move.

Rules:
- framed as execution, not selection
- culturally accurate phrasing
- reinforces stylistic identity

Each kimarite has a **dedicated descriptor pool**.

---

## 12. Sponsor & Kenshō Ceremony Layer

### 12.1 Sponsor Identity Slots
Optional placeholders:
- sponsorName
- sponsorCategory

Rules:
- neutral phrasing
- no brand tone
- no monetary reference

---

### 12.2 Kenshō Ceremony Sequence
Occurs after ruling & kimarite emphasis:

1. banners lowered  
2. envelopes presented  
3. rikishi acknowledgment  
4. crowd response  

Crowd memory updates AFTER ceremony.

---

## 13. Descriptor Variety & De‑Duplication Engine

### 13.1 Descriptor Sets
Each narrative beat owns a **Descriptor Set**.

Selection uses a deterministic hash of:
- boutId
- rikishiId(s)
- venueId
- voice
- tone
- crowd memory
- phrase usage history

---

### 13.2 Phrase Cooldown
- phrases have cooldown windows
- recently used phrases deprioritized
- least‑recently‑used selected if needed

---

### 13.3 Synonym Clusters
Semantically equivalent phrases grouped into clusters.

Only one cluster per beat.
Cluster selection is deterministic.

---

### 13.4 Guardrails
Forbidden:
- mixed tones
- adjective stacking
- metaphor drift
- contradictory reactions

---

## 14. Backend Fidelity (Hidden Contract)

Combat Engine V3 resolves:
1. Tachiai initiative  
2. Grip & stance  
3. Momentum & fatigue  
4. Position drift  
5. Finisher window  
6. Counter legality  
7. Kimarite selection  
8. Special ruling legality  

PBP consumes **resolved outputs only**.

---

## 15. Canonical Sample PBP Bout (Complete)

**Honbasho:** Kyushu Basho  
**Day:** 13  
**Division:** Makuuchi  
**Venue:** Fukuoka  
**Voice:** Dramatic  

**East Maegashira 3 — Kiryuzan**  
**West Komusubi — Hoshitora**

> “Day Thirteen in Fukuoka, and the hall is already alive.”  
> “Kiryuzan steps forward, lifting the salt high before casting it across the ring.”  
> “Hoshitora follows, stamping the clay, eyes fixed ahead.”  
> “The banners from [Sponsor Name] frame the dohyo as the crowd settles.”  
> “They crouch at the shikiri‑sen.”  
> “The fan drops—*tachiai!*”  
> “They crash together—the sound ripples through the hall!”  
> “Hoshitora presses—Kiryuzan bends but does not break.”  
> “A murmur spreads—he has the belt.”  
> “They drift toward the edge—voices rising!”  
> “A hesitation—just enough!”  
> “Kiryuzan drives through with **a textbook yorikiri!**”  
> “Out!”  
> “The hall erupts!”  
> “The banners are lowered.”  
> “The envelopes are presented, one by one.”  
> “Kiryuzan receives the kenshō with a measured bow.”

---

## 16. Canonical Lock‑In Principles

- Ritual precedes combat  
- The move defines the memory  
- Silence is meaningful  
- Ceremony completes victory  
- Numbers never appear  

---

**END OF Sumo Play‑by‑Play System v3.2 — ULTIMATE DEFINITIVE CANON**
