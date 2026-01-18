// saveload.ts
// Save/Load System — Persistence Canon Implementation
// Follows Constitution §9: Save Philosophy and Save File Structure
//
// FIXES APPLIED (canon + correctness):
// - Renamed Stable Lords key prefix + filenames -> Basho (project rename).
// - Removed unused imports; tightened types.
// - Added explicit JSON-safe world schema + validation helpers.
// - Added deterministic "createdAtISO" preservation (createdAt stays original on overwrite).
// - Added optional migrations scaffold (versioned, non-lossy).
// - Added safe localStorage guards (SSR / private mode).
// - Save slot discovery excludes autosave from numbered slots by default.
// - SAVE_SLOT_COUNT enforced in quickSave with true "oldest save" overwrite, not always slot_1.
// - exportSave filename corrected to `basho_...`.
// - Map serialization preserved; ordering stabilized by sorting keys.
// - getSaveSlotInfos reads venue/playerHeya safely (heyas is a Record in save).

import type {
  WorldState,
  Heya,
  Rikishi,
  BashoState,
  SaveVersion,
  BashoResult,
  FTUEState,
  BanzukeSnapshot,
  BashoName,
  Id
} from "./types";

// === SAVE VERSION ===
export const CURRENT_SAVE_VERSION: SaveVersion = "1.0.0";

// Canon: project is Basho
const SAVE_KEY_PREFIX = "basho_save_";
const AUTOSAVE_SLOT_NAME = "autosave";
const AUTOSAVE_KEY = `${SAVE_KEY_PREFIX}${AUTOSAVE_SLOT_NAME}`;
const SAVE_SLOT_COUNT = 5;

// === STORAGE GUARDS ===
function hasLocalStorage(): boolean {
  try {
    return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
  } catch {
    return false;
  }
}

// === SERIALIZATION HELPERS ===

/** Convert Map to plain object for JSON serialization (stable key ordering). */
function mapToObject<T>(map: Map<string, T>): Record<string, T> {
  const obj: Record<string, T> = {};
  const keys = Array.from(map.keys()).sort();
  for (const key of keys) obj[key] = map.get(key)!;
  return obj;
}

/** Convert plain object back to Map */
function objectToMap<T>(obj: Record<string, T>): Map<string, T> {
  const map = new Map<string, T>();
  for (const key of Object.keys(obj)) map.set(key, obj[key]);
  return map;
}

// === SERIALIZED TYPES (JSON-safe) ===

interface SerializedBashoState {
  year: number;
  bashoNumber: 1 | 2 | 3 | 4 | 5 | 6;
  bashoName: BashoName;
  day: number;
  matches: BashoState["matches"];
  standings: Record<string, { wins: number; losses: number }>;
}

interface SerializedWorldState {
  seed: string;
  year: number;
  week: number;
  currentBashoName?: BashoName;
  heyas: Record<string, Heya>;
  rikishi: Record<string, Rikishi>;
  currentBasho?: SerializedBashoState;
  history: BashoResult[];
  ftue: FTUEState;
  playerHeyaId?: Id;
  currentBanzuke?: BanzukeSnapshot;
}

export interface SerializedSaveGame {
  version: SaveVersion;
  createdAtISO: string;
  lastSavedAtISO: string;
  ruleset: {
    banzukeAlgorithm: "slot_fill_v1";
    kimariteRegistryVersion: string;
  };
  world: SerializedWorldState;
  saveSlotName?: string;
  playTimeMinutes?: number;
}

// === BashoState serialization ===
function serializeBashoState(basho: BashoState): SerializedBashoState {
  return {
    ...basho,
    standings: mapToObject(basho.standings)
  };
}

function deserializeBashoState(basho: SerializedBashoState): BashoState {
  return {
    ...basho,
    standings: objectToMap(basho.standings)
  };
}

// === WORLD SERIALIZATION ===

export function serializeWorld(world: WorldState): SerializedWorldState {
  return {
    seed: world.seed,
    year: world.year,
    week: world.week,
    currentBashoName: world.currentBashoName,
    heyas: mapToObject(world.heyas),
    rikishi: mapToObject(world.rikishi),
    currentBasho: world.currentBasho ? serializeBashoState(world.currentBasho) : undefined,
    history: world.history,
    ftue: world.ftue,
    playerHeyaId: world.playerHeyaId,
    currentBanzuke: world.currentBanzuke
  };
}

export function deserializeWorld(serialized: SerializedWorldState): WorldState {
  return {
    seed: serialized.seed,
    year: serialized.year,
    week: serialized.week,
    currentBashoName: serialized.currentBashoName,
    heyas: objectToMap(serialized.heyas),
    rikishi: objectToMap(serialized.rikishi),
    currentBasho: serialized.currentBasho ? deserializeBashoState(serialized.currentBasho) : undefined,
    history: serialized.history,
    ftue: serialized.ftue,
    playerHeyaId: serialized.playerHeyaId,
    currentBanzuke: serialized.currentBanzuke
  };
}

// === VALIDATION ===
function isSerializedSaveGame(x: any): x is SerializedSaveGame {
  return (
    x &&
    typeof x === "object" &&
    typeof x.version === "string" &&
    typeof x.createdAtISO === "string" &&
    typeof x.lastSavedAtISO === "string" &&
    x.ruleset &&
    typeof x.ruleset.banzukeAlgorithm === "string" &&
    typeof x.ruleset.kimariteRegistryVersion === "string" &&
    x.world &&
    typeof x.world.seed === "string" &&
    typeof x.world.year === "number" &&
    typeof x.world.week === "number" &&
    x.world.heyas &&
    x.world.rikishi
  );
}

// === MIGRATIONS (non-lossy scaffold) ===
type MigrationFn = (save: SerializedSaveGame) => SerializedSaveGame;

const MIGRATIONS: Record<string, MigrationFn> = {
  // Example:
  // "0.9.0->1.0.0": (save) => ({ ...save, version: "1.0.0" as SaveVersion })
};

function migrateToCurrent(save: SerializedSaveGame): SerializedSaveGame {
  if (save.version === CURRENT_SAVE_VERSION) return save;

  // Minimal safe strategy: try known migrations; otherwise keep data but bump version.
  // (Non-lossy: we do NOT delete unknown fields; we only transform if we know how.)
  const directKey = `${save.version}->${CURRENT_SAVE_VERSION}`;
  const fn = MIGRATIONS[directKey];
  if (fn) return fn(save);

  return { ...save, version: CURRENT_SAVE_VERSION };
}

// === SAVE GAME CREATION ===

/**
 * Create a save object from WorldState.
 * If an existing save JSON is provided, preserves createdAtISO.
 */
export function createSaveGame(world: WorldState, slotName?: string, existing?: SerializedSaveGame): SerializedSaveGame {
  const now = new Date().toISOString();
  return {
    version: CURRENT_SAVE_VERSION,
    createdAtISO: existing?.createdAtISO ?? now,
    lastSavedAtISO: now,
    ruleset: {
      banzukeAlgorithm: "slot_fill_v1",
      kimariteRegistryVersion: "82_official_v1"
    },
    world: serializeWorld(world),
    saveSlotName: slotName
  };
}

// === STORAGE KEYS ===

function toSlotKey(slotName: string): string {
  // Allow passing full key or bare slotName
  return slotName.startsWith(SAVE_KEY_PREFIX) ? slotName : `${SAVE_KEY_PREFIX}${slotName}`;
}

/** Get all save keys (includes autosave). */
export function getSaveSlotKeys(): string[] {
  if (!hasLocalStorage()) return [];

  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(SAVE_KEY_PREFIX)) keys.push(key);
  }
  return keys.sort();
}

// === METADATA LISTING ===

export interface SaveSlotInfo {
  key: string;
  slotName: string;
  year: number;
  bashoName?: BashoName;
  playerHeyaName?: string;
  savedAt: string;
  version: SaveVersion;
  isAutosave: boolean;
}

export function getSaveSlotInfos(): SaveSlotInfo[] {
  if (!hasLocalStorage()) return [];

  const keys = getSaveSlotKeys();
  const infos: SaveSlotInfo[] = [];

  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;

      const parsed = JSON.parse(raw);
      if (!isSerializedSaveGame(parsed)) continue;

      const save = parsed as SerializedSaveGame;
      const slotName = save.saveSlotName || key.replace(SAVE_KEY_PREFIX, "");

      const playerHeya =
        save.world.playerHeyaId && save.world.heyas
          ? save.world.heyas[String(save.world.playerHeyaId)]
          : undefined;

      infos.push({
        key,
        slotName,
        year: save.world.year,
        bashoName: save.world.currentBashoName,
        playerHeyaName: playerHeya?.name,
        savedAt: save.lastSavedAtISO,
        version: save.version,
        isAutosave: slotName === AUTOSAVE_SLOT_NAME || key === AUTOSAVE_KEY
      });
    } catch {
      // Ignore corrupt entries; listing should never hard-fail.
      continue;
    }
  }

  // Sort: autosave first, then slot_1..slot_n, then others by recency
  infos.sort((a, b) => {
    if (a.isAutosave !== b.isAutosave) return a.isAutosave ? -1 : 1;
    const aIsSlot = /^slot_\d+$/.test(a.slotName);
    const bIsSlot = /^slot_\d+$/.test(b.slotName);
    if (aIsSlot && bIsSlot) {
      const an = Number(a.slotName.split("_")[1]);
      const bn = Number(b.slotName.split("_")[1]);
      return an - bn;
    }
    if (aIsSlot !== bIsSlot) return aIsSlot ? -1 : 1;
    return b.savedAt.localeCompare(a.savedAt);
  });

  return infos;
}

// === SAVE / LOAD ===

export function saveGame(world: WorldState, slotName: string): boolean {
  if (!hasLocalStorage()) return false;

  try {
    const key = toSlotKey(slotName);

    // Preserve createdAtISO if overwriting
    const existingRaw = localStorage.getItem(key);
    const existingParsed = existingRaw ? JSON.parse(existingRaw) : null;
    const existing = isSerializedSaveGame(existingParsed) ? (existingParsed as SerializedSaveGame) : undefined;

    const save = createSaveGame(world, slotName, existing);
    localStorage.setItem(key, JSON.stringify(save));
    return true;
  } catch (e) {
    console.error("Failed to save game:", e);
    return false;
  }
}

export function autosave(world: WorldState): boolean {
  return saveGame(world, AUTOSAVE_SLOT_NAME);
}

export function loadGame(slotNameOrKey: string): WorldState | null {
  if (!hasLocalStorage()) return null;

  try {
    const key = toSlotKey(slotNameOrKey);
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!isSerializedSaveGame(parsed)) return null;

    let save = parsed as SerializedSaveGame;

    // Migrate if needed
    if (save.version !== CURRENT_SAVE_VERSION) {
      save = migrateToCurrent(save);
    }

    return deserializeWorld(save.world);
  } catch (e) {
    console.error("Failed to load game:", e);
    return null;
  }
}

export function loadAutosave(): WorldState | null {
  return loadGame(AUTOSAVE_SLOT_NAME);
}

export function hasAutosave(): boolean {
  if (!hasLocalStorage()) return false;
  return localStorage.getItem(AUTOSAVE_KEY) !== null;
}

export function deleteSave(slotNameOrKey: string): boolean {
  if (!hasLocalStorage()) return false;

  try {
    const key = toSlotKey(slotNameOrKey);
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error("Failed to delete save:", e);
    return false;
  }
}

// === EXPORT / IMPORT ===

export function exportSave(world: WorldState, filename?: string): void {
  const save = createSaveGame(world);
  const json = JSON.stringify(save, null, 2);

  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `basho_${world.year}_${world.currentBashoName || "save"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

export async function importSave(file: File): Promise<WorldState | null> {
  try {
    const text = await file.text();
    const parsed = JSON.parse(text);

    if (!isSerializedSaveGame(parsed)) {
      throw new Error("Invalid save file structure");
    }

    let save = parsed as SerializedSaveGame;
    if (save.version !== CURRENT_SAVE_VERSION) save = migrateToCurrent(save);

    return deserializeWorld(save.world);
  } catch (e) {
    console.error("Failed to import save:", e);
    return null;
  }
}

// === SLOT HELPERS ===

export function getAvailableSlotNames(): string[] {
  return Array.from({ length: SAVE_SLOT_COUNT }, (_, i) => `slot_${i + 1}`);
}

/**
 * Quick save:
 * - uses first empty numbered slot
 * - else overwrites oldest numbered slot (not autosave)
 */
export function quickSave(world: WorldState): boolean {
  const infos = getSaveSlotInfos().filter((s) => /^slot_\d+$/.test(s.slotName));

  const existing = new Set(infos.map((s) => s.slotName));

  // 1) first empty slot
  for (let i = 1; i <= SAVE_SLOT_COUNT; i++) {
    const slot = `slot_${i}`;
    if (!existing.has(slot)) return saveGame(world, slot);
  }

  // 2) overwrite oldest numbered slot
  const oldest = infos
    .slice()
    .sort((a, b) => a.savedAt.localeCompare(b.savedAt))[0];

  return saveGame(world, oldest?.slotName || "slot_1");
}
