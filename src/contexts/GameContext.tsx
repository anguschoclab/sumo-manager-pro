// Game State Context - Central state management for Basho
// UPDATED: Now delegates exclusively to src/engine/world.ts for simulation logic.

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import type { WorldState, Rikishi, Heya, BoutResult } from "@/engine/types";
import { generateWorld } from "@/engine/worldgen";
import { saveGame, loadGame, autosave, hasAutosave, loadAutosave, getSaveSlotInfos, type SaveSlotInfo } from "@/engine/saveload";

// === ENGINE IMPORTS ===
import { 
  startBasho, 
  advanceBashoDay, 
  simulateBoutForToday, 
  endBasho, 
  publishBanzukeUpdate, 
  advanceInterim 
} from "@/engine/world";

// === STATE TYPES ===

export type GamePhase = 
  | "menu"           
  | "worldgen"       
  | "interim"        
  | "basho"          
  | "day_preview"    
  | "bout"           
  | "day_results"    
  | "basho_results"  
  | "stable"         
  | "banzuke"        
  | "rikishi"        
  | "economy"        
  | "governance"     
  | "history";       

export interface GameState {
  phase: GamePhase;
  world: WorldState | null;
  selectedRikishiId: string | null;
  selectedHeyaId: string | null;
  currentBoutIndex: number;
  lastBoutResult: BoutResult | null;
  playerHeyaId: string | null;
  isAutoPlaying: boolean;
}

// === ACTIONS ===

type GameAction =
  | { type: "CREATE_WORLD"; seed: string; playerHeyaId?: string }
  | { type: "SET_PLAYER_HEYA"; heyaId: string }
  | { type: "SET_PHASE"; phase: GamePhase }
  | { type: "START_BASHO" }
  | { type: "ADVANCE_DAY" }
  | { type: "ADVANCE_WEEK"; weeks?: number } // NEW: For interim ticking
  | { type: "SIMULATE_BOUT"; boutIndex: number }
  | { type: "SIMULATE_ALL_BOUTS" }
  | { type: "END_DAY" }
  | { type: "END_BASHO" }
  | { type: "PUBLISH_BANZUKE" } // NEW: Transitions post-basho -> interim
  | { type: "SELECT_RIKISHI"; id: string | null }
  | { type: "SELECT_HEYA"; id: string | null }
  | { type: "SET_AUTO_PLAY"; value: boolean }
  | { type: "LOAD_WORLD"; world: WorldState };

// === INITIAL STATE ===

const initialState: GameState = {
  phase: "menu",
  world: null,
  selectedRikishiId: null,
  selectedHeyaId: null,
  currentBoutIndex: 0,
  lastBoutResult: null,
  playerHeyaId: null,
  isAutoPlaying: false,
};

// === REDUCER ===

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "CREATE_WORLD": {
      const world = generateWorld({ seed: action.seed });
      const playerHeyaId = action.playerHeyaId || null;
      if (playerHeyaId) {
        const heya = world.heyas.get(playerHeyaId);
        if (heya) heya.isPlayerOwned = true;
      }
      return {
        ...state,
        world: { ...world, playerHeyaId: playerHeyaId || undefined },
        playerHeyaId,
        phase: playerHeyaId ? "interim" : "menu",
      };
    }

    case "SET_PLAYER_HEYA": {
      if (!state.world) return state;
      const heya = state.world.heyas.get(action.heyaId);
      if (heya) heya.isPlayerOwned = true;
      return {
        ...state,
        world: { ...state.world, playerHeyaId: action.heyaId },
        playerHeyaId: action.heyaId,
        phase: "interim",
      };
    }

    case "SET_PHASE": {
      return { ...state, phase: action.phase };
    }

    case "START_BASHO": {
      if (!state.world) return state;
      // DELEGATE TO ENGINE
      const newWorld = startBasho(state.world);
      return {
        ...state,
        world: newWorld,
        phase: "day_preview",
        currentBoutIndex: 0,
      };
    }

    case "ADVANCE_DAY": {
      if (!state.world?.currentBasho) return state;
      const day = state.world.currentBasho.day;
      
      if (day >= 15) {
        return { ...state, phase: "basho_results" };
      }
      
      // DELEGATE TO ENGINE
      const newWorld = advanceBashoDay(state.world);
      return {
        ...state,
        world: newWorld,
        phase: "day_preview",
        currentBoutIndex: 0,
      };
    }

    case "ADVANCE_WEEK": {
      if (!state.world) return state;
      // DELEGATE TO ENGINE (Simulates training, economy, etc.)
      const newWorld = advanceInterim(state.world, action.weeks || 1);
      return {
        ...state,
        world: newWorld,
        // No phase change needed, usually stays in interim/stable view
      };
    }

    case "SIMULATE_BOUT": {
      if (!state.world?.currentBasho) return state;
      
      // DELEGATE TO ENGINE
      const { world: newWorld, result } = simulateBoutForToday(state.world, action.boutIndex);
      
      return {
        ...state,
        world: newWorld,
        lastBoutResult: result || null,
        currentBoutIndex: action.boutIndex + 1,
      };
    }

    case "SIMULATE_ALL_BOUTS": {
      if (!state.world?.currentBasho) return state;
      
      let currentState = state;
      const basho = state.world.currentBasho;
      const dayMatches = basho.matches.filter(m => m.day === basho.day && !m.result);
      
      // Chaining reducer calls is okay here for synchronous updates
      for (let i = 0; i < dayMatches.length; i++) {
        currentState = gameReducer(currentState, { type: "SIMULATE_BOUT", boutIndex: i });
      }
      
      return { ...currentState, phase: "day_results" };
    }

    case "END_DAY": {
      return { ...state, phase: "day_results" };
    }

    case "END_BASHO": {
      if (!state.world) return state;
      // DELEGATE TO ENGINE (Calculates prizes, retires rikishi)
      const newWorld = endBasho(state.world);
      return {
        ...state,
        world: newWorld,
        phase: "basho_results", 
      };
    }

    case "PUBLISH_BANZUKE": {
      if (!state.world) return state;
      // DELEGATE TO ENGINE (Updates ranks, moves time to next year/basho)
      const newWorld = publishBanzukeUpdate(state.world);
      return {
        ...state,
        world: newWorld,
        phase: "interim"
      };
    }

    case "SELECT_RIKISHI": {
      return { 
        ...state, 
        selectedRikishiId: action.id,
        phase: action.id ? "rikishi" : state.phase,
      };
    }

    case "SELECT_HEYA": {
      return { 
        ...state, 
        selectedHeyaId: action.id,
        phase: action.id ? "stable" : state.phase,
      };
    }

    case "SET_AUTO_PLAY": {
      return { ...state, isAutoPlaying: action.value };
    }

    case "LOAD_WORLD": {
      return {
        ...state,
        world: action.world,
        playerHeyaId: action.world.playerHeyaId || null,
        phase: action.world.playerHeyaId ? "interim" : "menu",
      };
    }

    default:
      return state;
  }
}

// === CONTEXT ===

interface GameContextValue {
  state: GameState;
  
  createWorld: (seed: string, playerHeyaId?: string) => void;
  setPhase: (phase: GamePhase) => void;
  selectRikishi: (id: string | null) => void;
  selectHeya: (id: string | null) => void;
  
  startBasho: () => void;
  advanceDay: () => void;
  advanceWeek: (weeks?: number) => void; // Exposed to UI
  simulateBout: (index: number) => void;
  simulateAllBouts: () => void;
  endDay: () => void;
  endBasho: () => void;
  publishBanzuke: () => void; // Exposed to UI

  saveToSlot: (slotName: string) => boolean;
  loadFromSlot: (slotName: string) => boolean;
  quickSave: () => boolean;
  loadFromAutosave: () => boolean;
  hasAutosave: () => boolean;
  getSaveSlots: () => SaveSlotInfo[];
  
  getRikishi: (id: string) => Rikishi | undefined;
  getHeya: (id: string) => Heya | undefined;
  getCurrentDayMatches: () => ReturnType<typeof getMatchesForDay>;
  getStandings: () => Array<{ rikishi: Rikishi; wins: number; losses: number }>;
}

const GameContext = createContext<GameContextValue | null>(null);

function getMatchesForDay(world: WorldState | null) {
  if (!world?.currentBasho) return [];
  const day = world.currentBasho.day;
  return world.currentBasho.matches
    .filter(m => m.day === day)
    .map(m => ({
      ...m,
      east: world.rikishi.get(m.eastRikishiId),
      west: world.rikishi.get(m.westRikishiId),
    }));
}

// === PROVIDER ===

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const createWorld = useCallback((seed: string, playerHeyaId?: string) => {
    dispatch({ type: "CREATE_WORLD", seed, playerHeyaId });
  }, []);

  const setPhase = useCallback((phase: GamePhase) => {
    dispatch({ type: "SET_PHASE", phase });
  }, []);

  const selectRikishi = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_RIKISHI", id });
  }, []);

  const selectHeya = useCallback((id: string | null) => {
    dispatch({ type: "SELECT_HEYA", id });
  }, []);

  const startBasho = useCallback(() => {
    dispatch({ type: "START_BASHO" });
  }, []);

  const advanceDay = useCallback(() => {
    dispatch({ type: "ADVANCE_DAY" });
  }, []);

  const advanceWeek = useCallback((weeks: number = 1) => {
    dispatch({ type: "ADVANCE_WEEK", weeks });
  }, []);

  const simulateBoutAction = useCallback((index: number) => {
    dispatch({ type: "SIMULATE_BOUT", boutIndex: index });
  }, []);

  const simulateAllBouts = useCallback(() => {
    dispatch({ type: "SIMULATE_ALL_BOUTS" });
  }, []);

  const endDay = useCallback(() => {
    dispatch({ type: "END_DAY" });
  }, []);

  const endBasho = useCallback(() => {
    dispatch({ type: "END_BASHO" });
  }, []);

  const publishBanzuke = useCallback(() => {
    dispatch({ type: "PUBLISH_BANZUKE" });
  }, []);

  const getRikishi = useCallback((id: string) => {
    return state.world?.rikishi.get(id);
  }, [state.world]);

  const getHeya = useCallback((id: string) => {
    return state.world?.heyas.get(id);
  }, [state.world]);

  const getCurrentDayMatches = useCallback(() => {
    return getMatchesForDay(state.world);
  }, [state.world]);

  const getStandings = useCallback(() => {
    if (!state.world?.currentBasho) return [];
    const standings = state.world.currentBasho.standings;
    return Array.from(state.world.rikishi.values())
      .filter(r => r.division === "makuuchi")
      .map(r => ({
        rikishi: r,
        wins: standings.get(r.id)?.wins || 0,
        losses: standings.get(r.id)?.losses || 0,
      }))
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses);
  }, [state.world]);

  // Save/Load
  const saveToSlot = useCallback((slotName: string) => {
    if (!state.world) return false;
    return saveGame(state.world, slotName);
  }, [state.world]);

  const loadFromSlot = useCallback((slotName: string) => {
    const world = loadGame(slotName);
    if (world) {
      dispatch({ type: "LOAD_WORLD", world });
      return true;
    }
    return false;
  }, []);

  const quickSaveAction = useCallback(() => {
    if (!state.world) return false;
    autosave(state.world);
    return true;
  }, [state.world]);

  const loadFromAutosave = useCallback(() => {
    const world = loadAutosave();
    if (world) {
      dispatch({ type: "LOAD_WORLD", world });
      return true;
    }
    return false;
  }, []);

  const hasAutosaveCheck = useCallback(() => hasAutosave(), []);
  const getSaveSlots = useCallback(() => getSaveSlotInfos(), []);

  const value: GameContextValue = {
    state,
    createWorld,
    setPhase,
    selectRikishi,
    selectHeya,
    startBasho,
    advanceDay,
    advanceWeek,
    simulateBout: simulateBoutAction,
    simulateAllBouts,
    endDay,
    endBasho,
    publishBanzuke,
    saveToSlot,
    loadFromSlot,
    quickSave: quickSaveAction,
    loadFromAutosave,
    hasAutosave: hasAutosaveCheck,
    getSaveSlots,
    getRikishi,
    getHeya,
    getCurrentDayMatches,
    getStandings,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
}

// === HOOK ===

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
