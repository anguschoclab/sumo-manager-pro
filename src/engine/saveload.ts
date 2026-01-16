// Save/Load System - Persistence Canon Implementation
// Follows Constitution §9: Save Philosophy and Save File Structure

import type { 
  WorldState, Heya, Rikishi, BashoState, SaveGame, SaveVersion,
  BashoResult, FTUEState, BanzukeSnapshot, BashoName, Id
} from "./types";

// === SAVE VERSION ===
export const CURRENT_SAVE_VERSION: SaveVersion = "1.0.0";
const SAVE_KEY_PREFIX = "stablelords_save_";
const AUTOSAVE_KEY = `${SAVE_KEY_PREFIX}autosave`;
const SAVE_SLOT_COUNT = 5;

// === SERIALIZATION HELPERS ===

/** Convert Map to plain object for JSON serialization */
function mapToObject<T>(map: Map<string, T>): Record<string, T> {
  const obj: Record<string, T> = {};
  for (const [key, value] of map.entries()) {
    obj[key] = value;
  }
  return obj;
}

/** Convert plain object back to Map */
function objectToMap<T>(obj: Record<string, T>): Map<string, T> {
  const map = new Map<string, T>();
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      map.set(key, obj[key]);
    }
  }
  return map;
}

/** Serialize BashoState (convert standings Map) */
function serializeBashoState(basho: BashoState): SerializedBashoState {
  return {
    ...basho,
    standings: mapToObject(basho.standings),
  };
}

/** Deserialize BashoState (restore standings Map) */
function deserializeBashoState(basho: SerializedBashoState): BashoState {
  return {
    ...basho,
    standings: objectToMap(basho.standings),
  };
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

interface SerializedSaveGame {
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

// === SERIALIZATION ===

/** Serialize WorldState for saving */
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
    currentBanzuke: world.currentBanzuke,
  };
}

/** Deserialize WorldState from save */
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
    currentBanzuke: serialized.currentBanzuke,
  };
}

// === SAVE GAME CREATION ===

/** Create a SaveGame object from WorldState */
export function createSaveGame(world: WorldState, slotName?: string): SerializedSaveGame {
  const now = new Date().toISOString();
  return {
    version: CURRENT_SAVE_VERSION,
    createdAtISO: now,
    lastSavedAtISO: now,
    ruleset: {
      banzukeAlgorithm: "slot_fill_v1",
      kimariteRegistryVersion: "82_official_v1",
    },
    world: serializeWorld(world),
    saveSlotName: slotName,
  };
}

// === LOCAL STORAGE OPERATIONS ===

/** Get all save slot keys */
export function getSaveSlotKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(SAVE_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys.sort();
}

/** Get save slot metadata without loading full world */
export interface SaveSlotInfo {
  key: string;
  slotName: string;
  year: number;
  bashoName?: BashoName;
  playerHeyaName?: string;
  savedAt: string;
  version: SaveVersion;
}

export function getSaveSlotInfos(): SaveSlotInfo[] {
  const keys = getSaveSlotKeys();
  const infos: SaveSlotInfo[] = [];
  
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      
      const save: SerializedSaveGame = JSON.parse(raw);
      const playerHeya = save.world.playerHeyaId 
        ? save.world.heyas[save.world.playerHeyaId]
        : undefined;
      
      infos.push({
        key,
        slotName: save.saveSlotName || key.replace(SAVE_KEY_PREFIX, ""),
        year: save.world.year,
        bashoName: save.world.currentBashoName,
        playerHeyaName: playerHeya?.name,
        savedAt: save.lastSavedAtISO,
        version: save.version,
      });
    } catch (e) {
      console.warn(`Failed to parse save slot ${key}:`, e);
    }
  }
  
  return infos;
}

/** Save game to a slot */
export function saveGame(world: WorldState, slotName: string): boolean {
  try {
    const key = `${SAVE_KEY_PREFIX}${slotName}`;
    const save = createSaveGame(world, slotName);
    const json = JSON.stringify(save);
    localStorage.setItem(key, json);
    console.log(`Game saved to slot: ${slotName}`);
    return true;
  } catch (e) {
    console.error("Failed to save game:", e);
    return false;
  }
}

/** Autosave game */
export function autosave(world: WorldState): boolean {
  try {
    const save = createSaveGame(world, "autosave");
    const json = JSON.stringify(save);
    localStorage.setItem(AUTOSAVE_KEY, json);
    return true;
  } catch (e) {
    console.error("Failed to autosave:", e);
    return false;
  }
}

/** Load game from a slot */
export function loadGame(slotName: string): WorldState | null {
  try {
    const key = slotName.startsWith(SAVE_KEY_PREFIX) ? slotName : `${SAVE_KEY_PREFIX}${slotName}`;
    const raw = localStorage.getItem(key);
    if (!raw) {
      console.warn(`No save found for slot: ${slotName}`);
      return null;
    }
    
    const save: SerializedSaveGame = JSON.parse(raw);
    
    // Version check and migration
    if (save.version !== CURRENT_SAVE_VERSION) {
      console.warn(`Save version ${save.version} differs from current ${CURRENT_SAVE_VERSION}, migrating...`);
      // Future: apply migrations here
    }
    
    const world = deserializeWorld(save.world);
    console.log(`Game loaded from slot: ${slotName}`);
    return world;
  } catch (e) {
    console.error("Failed to load game:", e);
    return null;
  }
}

/** Load autosave */
export function loadAutosave(): WorldState | null {
  return loadGame("autosave");
}

/** Check if autosave exists */
export function hasAutosave(): boolean {
  return localStorage.getItem(AUTOSAVE_KEY) !== null;
}

/** Delete a save slot */
export function deleteSave(slotName: string): boolean {
  try {
    const key = slotName.startsWith(SAVE_KEY_PREFIX) ? slotName : `${SAVE_KEY_PREFIX}${slotName}`;
    localStorage.removeItem(key);
    console.log(`Save deleted: ${slotName}`);
    return true;
  } catch (e) {
    console.error("Failed to delete save:", e);
    return false;
  }
}

/** Export save as downloadable JSON */
export function exportSave(world: WorldState, filename?: string): void {
  const save = createSaveGame(world);
  const json = JSON.stringify(save, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `stablelords_${world.year}_${world.currentBashoName || "save"}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Import save from JSON file */
export async function importSave(file: File): Promise<WorldState | null> {
  try {
    const text = await file.text();
    const save: SerializedSaveGame = JSON.parse(text);
    
    // Validate structure
    if (!save.version || !save.world || !save.world.seed) {
      throw new Error("Invalid save file structure");
    }
    
    return deserializeWorld(save.world);
  } catch (e) {
    console.error("Failed to import save:", e);
    return null;
  }
}

/** Get available save slot names */
export function getAvailableSlotNames(): string[] {
  const slots: string[] = [];
  for (let i = 1; i <= SAVE_SLOT_COUNT; i++) {
    slots.push(`slot_${i}`);
  }
  return slots;
}

/** Quick save to first available slot */
export function quickSave(world: WorldState): boolean {
  const existingSlots = getSaveSlotInfos()
    .filter(s => s.slotName.startsWith("slot_"))
    .map(s => s.slotName);
  
  // Find first empty slot or use oldest
  for (let i = 1; i <= SAVE_SLOT_COUNT; i++) {
    const slotName = `slot_${i}`;
    if (!existingSlots.includes(slotName)) {
      return saveGame(world, slotName);
    }
  }
  
  // All slots full, overwrite slot_1
  return saveGame(world, "slot_1");
}
