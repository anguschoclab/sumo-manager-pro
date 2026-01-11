// Game State Context - Central state management for Stable Lords
// Provides world state, basho control, and game actions

import React, { createContext, useContext, useReducer, useCallback, ReactNode } from "react";
import type { WorldState, BashoState, Rikishi, Heya, BoutResult, BashoName } from "@/engine/types";
import { generateWorld, initializeBasho, generateDaySchedule } from "@/engine/worldgen";
import { simulateBout } from "@/engine/bout";
import { BASHO_CALENDAR, getNextBasho } from "@/engine/calendar";
import { isKachiKoshi, isMakeKoshi } from "@/engine/banzuke";

// === STATE TYPES ===

export type GamePhase = 
  | "menu"           // Main menu / world selection
  | "worldgen"       // Creating new world
  | "interim"        // Between basho
  | "basho"          // During tournament
  | "day_preview"    // Before day's bouts
  | "bout"           // Watching a bout
  | "day_results"    // After day's bouts
  | "basho_results"  // End of tournament
  | "stable"         // Managing stable
  | "banzuke"        // Viewing rankings
  | "rikishi"        // Viewing wrestler
  | "economy"        // Financial view
  | "governance"     // Council/rules
  | "history";       // Past results

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
  | { type: "SIMULATE_BOUT"; boutIndex: number }
  | { type: "SIMULATE_ALL_BOUTS" }
  | { type: "END_DAY" }
  | { type: "END_BASHO" }
  | { type: "SELECT_RIKISHI"; id: string | null }
  | { type: "SELECT_HEYA"; id: string | null }
  | { type: "SET_AUTO_PLAY"; value: boolean }
  | { type: "UPDATE_WORLD"; world: WorldState };

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
      // Set player heya if provided, otherwise default to first heya
      const playerHeyaId = action.playerHeyaId || Array.from(world.heyas.keys())[0];
      // Mark player's heya as owned
      const heya = world.heyas.get(playerHeyaId);
      if (heya) {
        heya.isPlayerOwned = true;
      }
      return {
        ...state,
        world: { ...world, playerHeyaId },
        playerHeyaId,
        phase: "interim",
      };
    }

    case "SET_PLAYER_HEYA": {
      if (!state.world) return state;
      const heya = state.world.heyas.get(action.heyaId);
      if (heya) {
        heya.isPlayerOwned = true;
      }
      return {
        ...state,
        world: { ...state.world, playerHeyaId: action.heyaId },
        playerHeyaId: action.heyaId,
      };
    }

    case "SET_PHASE": {
      return { ...state, phase: action.phase };
    }

    case "START_BASHO": {
      if (!state.world || !state.world.currentBashoName) return state;
      
      const basho = initializeBasho(state.world, state.world.currentBashoName);
      generateDaySchedule(state.world, basho, 1, state.world.seed);
      
      return {
        ...state,
        world: {
          ...state.world,
          currentBasho: basho,
        },
        phase: "day_preview",
        currentBoutIndex: 0,
      };
    }

    case "ADVANCE_DAY": {
      if (!state.world?.currentBasho) return state;
      
      const basho = state.world.currentBasho;
      const newDay = basho.day + 1;
      
      if (newDay > 15) {
        return { ...state, phase: "basho_results" };
      }
      
      const updatedBasho = { ...basho, day: newDay };
      generateDaySchedule(state.world, updatedBasho, newDay, state.world.seed);
      
      return {
        ...state,
        world: {
          ...state.world,
          currentBasho: updatedBasho,
        },
        phase: "day_preview",
        currentBoutIndex: 0,
      };
    }

    case "SIMULATE_BOUT": {
      if (!state.world?.currentBasho) return state;
      
      const basho = state.world.currentBasho;
      const dayMatches = basho.matches.filter(m => m.day === basho.day && !m.result);
      const match = dayMatches[action.boutIndex];
      
      if (!match) return state;
      
      const east = state.world.rikishi.get(match.eastRikishiId);
      const west = state.world.rikishi.get(match.westRikishiId);
      
      if (!east || !west) return state;
      
      const boutSeed = `${state.world.seed}-${basho.bashoName}-d${basho.day}-b${action.boutIndex}`;
      const result = simulateBout(east, west, boutSeed);
      
      // Update match with result
      match.result = result;
      
      // Update rikishi records
      const winner = result.winner === "east" ? east : west;
      const loser = result.winner === "east" ? west : east;
      
      winner.currentBashoWins++;
      winner.careerWins++;
      loser.currentBashoLosses++;
      loser.careerLosses++;
      
      // Update standings
      const standings = new Map(basho.standings);
      const winnerStanding = standings.get(winner.id) || { wins: 0, losses: 0 };
      const loserStanding = standings.get(loser.id) || { wins: 0, losses: 0 };
      standings.set(winner.id, { wins: winnerStanding.wins + 1, losses: winnerStanding.losses });
      standings.set(loser.id, { wins: loserStanding.wins, losses: loserStanding.losses + 1 });
      
      return {
        ...state,
        world: {
          ...state.world,
          currentBasho: { ...basho, standings },
        },
        lastBoutResult: result,
        currentBoutIndex: action.boutIndex + 1,
      };
    }

    case "SIMULATE_ALL_BOUTS": {
      if (!state.world?.currentBasho) return state;
      
      let currentState = state;
      const basho = state.world.currentBasho;
      const dayMatches = basho.matches.filter(m => m.day === basho.day && !m.result);
      
      for (let i = 0; i < dayMatches.length; i++) {
        currentState = gameReducer(currentState, { type: "SIMULATE_BOUT", boutIndex: i });
      }
      
      return { ...currentState, phase: "day_results" };
    }

    case "END_DAY": {
      return { ...state, phase: "day_results" };
    }

    case "END_BASHO": {
      if (!state.world?.currentBasho) return state;
      
      // Calculate final standings and awards
      const basho = state.world.currentBasho;
      const standings = Array.from(basho.standings.entries())
        .map(([id, record]) => ({ id, ...record }))
        .sort((a, b) => b.wins - a.wins);
      
      const yushoWinner = standings[0]?.id;
      const junYusho = standings.filter(s => s.wins === standings[1]?.wins).map(s => s.id);
      
      // Create basho result
      const bashoResult = {
        year: basho.year,
        bashoNumber: basho.bashoNumber,
        bashoName: basho.bashoName,
        yusho: yushoWinner || "",
        junYusho,
        prizes: {
          yushoAmount: 10_000_000,
          junYushoAmount: 2_000_000,
          specialPrizes: 2_000_000,
        }
      };
      
      // Advance to next basho
      const nextBasho = getNextBasho(basho.bashoName);
      const nextYear = nextBasho === "hatsu" ? state.world.year + 1 : state.world.year;
      
      return {
        ...state,
        world: {
          ...state.world,
          year: nextYear,
          currentBashoName: nextBasho,
          currentBasho: undefined,
          history: [...state.world.history, bashoResult],
        },
        phase: "interim",
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

    case "UPDATE_WORLD": {
      return { ...state, world: action.world };
    }

    default:
      return state;
  }
}

// === CONTEXT ===

interface GameContextValue {
  state: GameState;
  
  // World management
  createWorld: (seed: string, playerHeyaId?: string) => void;
  
  // Navigation
  setPhase: (phase: GamePhase) => void;
  selectRikishi: (id: string | null) => void;
  selectHeya: (id: string | null) => void;
  
  // Basho control
  startBasho: () => void;
  advanceDay: () => void;
  simulateBout: (index: number) => void;
  simulateAllBouts: () => void;
  endDay: () => void;
  endBasho: () => void;
  
  // Helpers
  getRikishi: (id: string) => Rikishi | undefined;
  getHeya: (id: string) => Heya | undefined;
  getCurrentDayMatches: () => ReturnType<typeof getMatchesForDay>;
  getStandings: () => Array<{ rikishi: Rikishi; wins: number; losses: number }>;
}

const GameContext = createContext<GameContextValue | null>(null);

// Helper to get matches for current day
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

  const value: GameContextValue = {
    state,
    createWorld,
    setPhase,
    selectRikishi,
    selectHeya,
    startBasho,
    advanceDay,
    simulateBout: simulateBoutAction,
    simulateAllBouts,
    endDay,
    endBasho,
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
