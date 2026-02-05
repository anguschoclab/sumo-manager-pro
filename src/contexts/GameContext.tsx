import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { useToast } from "@/hooks/use-toast";
import { generateWorld, initializeBasho, generateDaySchedule } from "@/engine/worldgen";
import type {
  WorldState,
  BashoState,
  DaySchedule,
  AdvanceResult,
  SettingsState,
  SponsorState,
  RivalryState,
  Id,
} from "@/engine/types";

type GamePhase = "menu" | "interim" | "basho" | "post_basho";

export interface GameState {
  phase: GamePhase;
  world: WorldState | null;
  basho: BashoState | null;
  schedule: DaySchedule | null;
  playerHeyaId: Id | null;
  activeDay: number;
  settings: SettingsState;
  sponsors: SponsorState;
  rivalries: RivalryState;
  lastAdvance?: AdvanceResult | null;
}

type GameAction =
  | { type: "CREATE_WORLD"; seed: string; playerHeyaId?: string }
  | { type: "SELECT_HEYA"; heyaId: Id }
  | { type: "START_BASHO" }
  | { type: "ADVANCE_DAY" }
  | { type: "END_BASHO" }
  | { type: "LOAD_SAVE"; state: GameState }
  | { type: "RESET" }
  | { type: "SET_SETTINGS"; settings: Partial<SettingsState> };

const initialState: GameState = {
  phase: "menu",
  world: null,
  basho: null,
  schedule: null,
  playerHeyaId: null,
  activeDay: 1,
  settings: {
    fastMode: false,
    autoAdvance: false,
    pbpVerbose: true,
  },
  sponsors: {
    active: [],
    history: [],
  },
  rivalries: {
    active: [],
    history: [],
  },
  lastAdvance: null,
};

function reducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "CREATE_WORLD": {
      const world = generateWorld(action.seed);

      // If caller provides a playerHeyaId, prefer it, otherwise fallback to generated.
      const playerHeyaId = action.playerHeyaId ?? world.playerHeyaId ?? null;

      return {
        ...state,
        phase: playerHeyaId ? "interim" : "menu",
        world,
        playerHeyaId,
        basho: null,
        schedule: null,
        activeDay: 1,
        lastAdvance: null,
      };
    }

    case "SELECT_HEYA": {
      if (!state.world) return state;
      return {
        ...state,
        phase: "interim",
        world: { ...state.world, playerHeyaId: action.heyaId },
        playerHeyaId: action.heyaId,
      };
    }

    case "START_BASHO": {
      if (!state.world) return state;
      const basho = initializeBasho(state.world);
      const schedule = generateDaySchedule(basho);

      return {
        ...state,
        phase: "basho",
        basho,
        schedule,
        activeDay: basho.day ?? 1,
        lastAdvance: null,
      };
    }

    case "ADVANCE_DAY": {
      if (!state.world || !state.basho || !state.schedule) return state;

      // NOTE: your actual advance logic may be elsewhere; keeping existing pattern.
      const nextDay = Math.min(15, (state.basho.day ?? state.activeDay) + 1);

      const basho: BashoState = { ...state.basho, day: nextDay };
      const schedule = generateDaySchedule(basho);

      const ended = nextDay >= 15;

      return {
        ...state,
        basho,
        schedule,
        activeDay: nextDay,
        phase: ended ? "post_basho" : "basho",
      };
    }

    case "END_BASHO": {
      if (!state.world) return state;
      return {
        ...state,
        phase: "interim",
        basho: null,
        schedule: null,
        activeDay: 1,
      };
    }

    case "SET_SETTINGS": {
      return {
        ...state,
        settings: { ...state.settings, ...action.settings },
      };
    }

    case "LOAD_SAVE": {
      return action.state;
    }

    case "RESET": {
      return initialState;
    }

    default:
      return state;
  }
}

type GameContextValue = {
  state: GameState;
  createWorld: (seed: string, playerHeyaId?: Id) => void;
  selectHeya: (heyaId: Id) => void;
  startBasho: () => void;
  advanceDay: () => void;
  endBasho: () => void;
  setSettings: (settings: Partial<SettingsState>) => void;
  reset: () => void;
};

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { toast } = useToast();

  // Optional: persist state to localStorage if your app already did that.
  useEffect(() => {
    try {
      localStorage.setItem("basho_save", JSON.stringify(state));
    } catch (e) {
      // ignore
    }
  }, [state]);

  useEffect(() => {
    // Load on mount
    try {
      const raw = localStorage.getItem("basho_save");
      if (!raw) return;
      const parsed = JSON.parse(raw) as GameState;
      if (parsed && typeof parsed === "object") {
        dispatch({ type: "LOAD_SAVE", state: parsed });
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const value = useMemo<GameContextValue>(() => {
    return {
      state,
      createWorld: (seed, playerHeyaId) => dispatch({ type: "CREATE_WORLD", seed, playerHeyaId }),
      selectHeya: (heyaId) => dispatch({ type: "SELECT_HEYA", heyaId }),
      startBasho: () => dispatch({ type: "START_BASHO" }),
      advanceDay: () => dispatch({ type: "ADVANCE_DAY" }),
      endBasho: () => dispatch({ type: "END_BASHO" }),
      setSettings: (settings) => dispatch({ type: "SET_SETTINGS", settings }),
      reset: () => {
        try {
          localStorage.removeItem("basho_save");
        } catch (e) {
          // ignore
        }
        dispatch({ type: "RESET" });
        toast({ title: "Reset", description: "New run started." });
      },
    };
  }, [state, toast]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
