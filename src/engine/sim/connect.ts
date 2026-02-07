
export type MinuteEvent = { minute: number; text: string };
export type FightOutcomeBy = "Kill" | "KO" | "Exhaustion" | "Stoppage" | "Draw" | null;
export type FightOutcome = { winner: "A"|"D"|null; by: FightOutcomeBy; minutes: number; log: MinuteEvent[]; post: { xpA: number; xpD: number; hitsA?:number; hitsD?:number; gotKillA?:boolean; gotKillD?:boolean; tags?: string[]; } };
export type Plan = any;
const Bus:any=(globalThis as any).__dmBus, Sim:any=(globalThis as any).__dmSim, Fame:any=(globalThis as any).__dmFame, Save:any=(globalThis as any).__dmSave, NewsletterFeed:any=(globalThis as any).__dmNewsletterFeed;
function rid(){return `fight_${Date.now()}_${Math.floor(Math.random()*1e6)}`}
export async function simulateFightAndSignal(planA:Plan, planD:Plan, opts:any={}):Promise<FightOutcome>{
  if(!Sim?.simulateFight) throw new Error("Simulator not available");
  const id=opts.resultId||rid(); const outcome:FightOutcome=Sim.simulateFight(planA,planD);
  const summary={id,week:opts.week??(Save?.getWeek?.()??1),ts:Date.now(),a:planA?.self?.name??"A",d:planD?.self?.name??"D",aStyle:planA?.style,dStyle:planD?.style,winner:outcome.winner,by:outcome.by,minutes:outcome.minutes,tags:outcome?.post?.tags||[],tournamentId:opts.tournamentId||null};
  try{Fame?.bumpFromOutcome?.(id,planA,planD,outcome)}catch{}
  try{Save?.appendArenaHistory?.(summary)}catch{}
  try{NewsletterFeed?.appendFightResult?.({summary,transcript:outcome.log?.map((e:any)=>e.text)||[]})}catch{}
  try{Bus?.emit?.("fight:result",{id,planA,planD,outcome,summary})}catch{}
  try{const wn=outcome.winner==="A"? (planA?.self?.name||"A") : outcome.winner==="D"? (planD?.self?.name||"D") : "No one"; Bus?.emit?.("ui:toast",{kind:"narrative",title:`The arena roars for ${wn}!`,cta:{label:"View Newsletter",action:{type:"openNewsletter"}}})}catch{}
  return outcome;
}
