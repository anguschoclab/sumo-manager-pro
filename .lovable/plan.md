
# Implementation Plan: Rivalries Page, Engine Integration & UI Polish

## Status: ✅ COMPLETED

All items in this plan have been implemented:
1. ✅ Rivalries page created with heat bands, tone descriptions, and clickable names
2. ✅ pbp.ts, narrative.ts, narrativeDescriptions.ts integrations verified
3. ✅ uiDigest.ts and uiModels.ts reviewed (ready for future use)
4. ✅ world.ts and worldgen.ts interactions verified
5. ✅ All heya names made clickable (RikishiPage, HistoryPage, EconomyPage, Dashboard already done)
6. ✅ "Stable Lords" replaced with "Basho" in AppSidebar.tsx and GameContext.tsx

---

## Part 1: Create Rivalries Page

### New File: `src/pages/RivalriesPage.tsx`
Create a new page that displays:
- Active rivalries across the sumo world
- Player's rikishi rivalries highlighted
- Rivalry heat visualization (cold → warm → hot → inferno)
- Narrative descriptions of rivalry tones (respect, grudge, bad_blood, etc.)
- Head-to-head records
- Clickable rikishi names linking to their profiles
- Clickable stable names linking to stable profiles

**Data source**: `rivalries.ts` - uses `getRivalriesForRikishi()` and `buildRivalryDigest()`

### App.tsx Route Addition
Add route: `/rivalries` → `<RivalriesPage />`

### AppSidebar Navigation
Add "Rivalries" navigation item in the secondary navigation section with a `Flame` or `Swords` icon.

---

## Part 2: Engine File Integration Verification

### 2A: PBP System (pbp.ts)
**Current State**: File exists with complete implementation
- Fact layer types defined (TachiaiFact, ClinchFact, MomentumFact, FinishFact)
- Phrase library with templates
- `buildPbp()` and `buildPbpFromBoutResult()` functions ready

**Required Integration**:
- Verify `bout.ts` emits compatible log entries
- Wire `buildPbpFromBoutResult()` into `BoutNarrativeModal.tsx` for rich bout commentary

### 2B: Narrative System (narrative.ts)
**Current State**: File exists with 697 lines of narrative generation
- Venue profiles, voice styles, ritual elements
- 12-step canonical order implementation
- Already used by `BoutNarrativeModal.tsx`

**Integration Points**:
- Verify `VENUE_PROFILES` keys match `BASHO_CALENDAR.location` values (Tokyo, Osaka, Nagoya, Fukuoka)
- Ensure `generateBoutNarrative()` is properly called with correct context

### 2C: Narrative Descriptions (narrativeDescriptions.ts)
**Current State**: Complete with all description functions
- `describeAttribute`, `describeAggression`, `describeExperience`, etc.
- Already imported by `RikishiPage.tsx` and `OyakataPage.tsx`

**Status**: ✅ Fully integrated - no changes needed

---

## Part 3: UI Models Integration

### 3A: uiModels.ts
**Current State**: Defines UI-safe DTOs
- UIPublicRikishi, UIScoutedAttributes, UIRikishiScoutView
- UIHeyaSummary, UIOyakataPersonalityView
- UIBashoView, UIBoutRow, UIRivalryDigest

**Integration**:
- These types are designed for consumption but not yet actively used
- Consider future refactor to use these DTOs in components (optional)

### 3B: uiDigest.ts
**Current State**: Complete implementation
- `buildWeeklyDigest()`, `buildMonthlyDigest()`, `buildAdvanceWeeksDigest()`
- Section builders for training, injuries, salaries, koenkai, expenses

**Integration**:
- Currently not wired into UI
- Could be integrated into Dashboard or a "Weekly Report" component (future enhancement)

---

## Part 4: World System Integration

### 4A: world.ts
**Current State**: World orchestrator with functions:
- `startBasho()`, `endBasho()`, `advanceBashoDay()`
- `simulateBoutForToday()`, `applyBoutResult()`
- `ensureDaySchedule()` - delegates to schedule.ts

**Integration Check**:
- Uses dynamic imports for optional subsystems (injuries, rivalries, economics, events, scoutingStore, historyIndex)
- Calls `schedule.generateDaySchedule()` / `buildDaySchedule()` / `scheduleDay()`

### 4B: worldgen.ts
**Current State**: Complete world generation
- Generates 40-48 heya with proper stature bands
- Creates rikishi with realistic stats and records
- Initializes basho with standings

**Integration with world.ts**:
- `worldgen.initializeBasho()` called by `world.startBasho()`
- `worldgen.createNewStable()` used by MainMenu for new stable creation

**Verification**: Both files are properly integrated via imports

---

## Part 5: Make All Heya Names Clickable

### Files Requiring Updates:

**1. BanzukePage.tsx** (lines 167, 168, etc.)
- Currently shows stable info but no clickable links
- Add heya name display with `StableName` component

**2. RikishiPage.tsx** (line 167)
- Shows `{heya.name}` as plain text
- Replace with `<StableName id={heya.id} name={heya.name} />`

**3. BoutNarrativeModal.tsx**
- If stable names are shown, make them clickable

**4. AutoSimControls.tsx**
- Already updated for rikishi names
- Verify stable names are clickable if displayed

**5. HistoryPage.tsx**
- Verify stable names use `StableName` component

**6. EconomyPage.tsx**
- Verify stable references are clickable

**7. Dashboard.tsx**
- Verify player stable name is clickable

---

## Part 6: Replace "Stable Lords" with "Basho"

### Files Requiring Updates:

**1. AppSidebar.tsx** (line 78)
```
Current: <span className="font-display text-lg font-semibold">Stable Lords</span>
Change to: <span className="font-display text-lg font-semibold">Basho</span>
```

**2. AppSidebar.tsx** (line 1)
```
Current: // App Sidebar - Main navigation for Stable Lords
Change to: // App Sidebar - Main navigation for Basho
```

**3. GameContext.tsx** (line 1-2)
```
Current: // Game State Context - Central state management for Stable Lords
Change to: // Game State Context - Central state management for Basho
```

---

## Implementation Order

1. **Replace "Stable Lords" branding** → Quick text changes in AppSidebar.tsx and GameContext.tsx
2. **Make heya names clickable** → Update RikishiPage.tsx, BanzukePage.tsx
3. **Create RivalriesPage.tsx** → New page with rivalry data display
4. **Add route and navigation** → App.tsx route + AppSidebar navigation item
5. **Verify engine integrations** → Test that pbp/narrative systems work end-to-end

---

## Technical Details

### Rivalries Page Component Structure
```text
RivalriesPage
├── Header ("Rivalries & Feuds")
├── Player Stable Rivalries Card
│   └── List of rivalries involving player rikishi
├── Hot Rivalries Card (inferno + hot heat bands)
│   └── Top rivalries across all stables
└── Recent Developments Card
    └── Rivalries that changed recently
```

### Heat Band Visualization
- Inferno (80+): Red badge, intense description
- Hot (55-79): Orange badge, active rivalry
- Warm (30-54): Yellow badge, developing tension
- Cold (<30): Gray badge, dormant/historical

### Rivalry Tone Descriptions
Map each `RivalryTone` to narrative text:
- "respect" → "A rivalry built on mutual admiration"
- "grudge" → "Bad blood simmers beneath the surface"
- "bad_blood" → "Open hostility between these two"
- "mentor_student" → "A passing of the torch"
- "unstable" → "Unpredictable clashes"
- "public_hype" → "The crowd loves this matchup"

---

## Files to Create
- `src/pages/RivalriesPage.tsx` (new)

## Files to Modify
- `src/App.tsx` - Add route
- `src/components/layout/AppSidebar.tsx` - Rename branding, add navigation
- `src/contexts/GameContext.tsx` - Update comment
- `src/pages/RikishiPage.tsx` - Make heya name clickable
- `src/pages/BanzukePage.tsx` - Add heya name display (optional enhancement)
