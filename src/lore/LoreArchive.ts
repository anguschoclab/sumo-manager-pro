/* Duelmasters — Sprint 5A delta */
import type { FightSummary, HallEntry } from "../types/lore.d";

const KEY_FIGHTS = "dm.lore.fights";
const KEY_HALL   = "dm.lore.hall";

function loadArray<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}
function saveArray<T>(key: string, arr: T[]) { localStorage.setItem(key, JSON.stringify(arr)); }

export const LoreArchive = {
  allFights(): FightSummary[] { return loadArray<FightSummary>(KEY_FIGHTS); },
  allHall(): HallEntry[] { return loadArray<HallEntry>(KEY_HALL); },
  signalFight(f: FightSummary) {
    const fights = LoreArchive.allFights();
    fights.push(f);
    while (fights.length > 500) fights.shift();
    saveArray(KEY_FIGHTS, fights);
  },
  markFightOfWeek(week: number, fightId: string) {
    const hall = LoreArchive.allHall().filter(h => !(h.label === "Fight of the Week" && h.week === week));
    hall.push({ week, label: "Fight of the Week", fightId });
    saveArray(KEY_HALL, hall);
  },
  markFightOfTournament(week: number, fightId: string) {
    const hall = LoreArchive.allHall().filter(h => !(h.label === "Fight of the Tournament" && h.week === week));
    hall.push({ week, label: "Fight of the Tournament", fightId });
    saveArray(KEY_HALL, hall);
  },
};
