
// Stable Lords — Delta v1.4.3
// Newsletter + Tournament modal (self-contained, no React build required)
(() => {
  if (window.SL_DELTA_143) return;
  window.SL_DELTA_143 = true;

  const VERSION = "v1.4.3";
  const now = () => new Date().toISOString();

  // --- tiny DOM helpers ---
  const qs = (sel, el=document) => el.querySelector(sel);
  const qsa = (sel, el=document) => Array.from(el.querySelectorAll(sel));
  const el = (tag, attrs={}, ...children) => {
    const n = document.createElement(tag);
    Object.entries(attrs).forEach(([k,v]) => {
      if (k === "style" && typeof v === "object") Object.assign(n.style, v);
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v !== null && v !== undefined) n.setAttribute(k, v);
    });
    children.flat().forEach(c => {
      if (c == null) return;
      if (typeof c === "string") n.appendChild(document.createTextNode(c));
      else n.appendChild(c);
    });
    return n;
  };
  const injectStyles = () => {
    if (qs("#sl-delta-143-style")) return;
    const s = el("style", { id:"sl-delta-143-style" }, `
      .sl-modal-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;z-index:9999}
      .sl-modal{width:min(960px,92vw);max-height:88vh;overflow:auto;background:#0b1220;border:1px solid #1f2a3a;border-radius:16px;box-shadow:0 20px 80px rgba(0,0,0,.5)}
      .sl-head{display:flex;justify-content:space-between;align-items:center;padding:14px 16px;border-bottom:1px solid #1f2a3a;position:sticky;top:0;background:#0b1220;border-top-left-radius:16px;border-top-right-radius:16px}
      .sl-title{font-weight:800;font-size:16px}
      .sl-body{padding:16px;display:grid;grid-template-columns:1fr 1fr;gap:12px}
      .sl-col{display:flex;flex-direction:column;gap:10px}
      .sl-card{background:#0e1626;border:1px solid #1f2a3a;border-radius:12px;padding:12px}
      .sl-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
      .sl-btn{padding:8px 12px;border-radius:10px;background:#111a2c;border:1px solid #1f2a3a;color:#e6eefb;cursor:pointer}
      .sl-btn:hover{border-color:#60a5fa}
      .sl-badge{padding:2px 8px;border-radius:999px;border:1px solid #22314a;background:#0d1524;color:#9db0cf;font-weight:700}
      .sl-input{background:#0d1524;border:1px solid #1f2a3a;border-radius:8px;color:#e6eefb;padding:8px 10px;width:100%}
      .sl-list{display:flex;flex-direction:column;gap:6px}
      .sl-item{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:6px 8px;border:1px solid #1f2a3a;border-radius:8px;background:#0c1422}
      .sl-chip{background:#172033;border:1px solid #26344a;border-radius:999px;padding:2px 8px;color:#9db0cf;font-weight:700}
      .sl-footer{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid #1f2a3a;position:sticky;bottom:0;background:#0b1220;border-bottom-left-radius:16px;border-bottom-right-radius:16px}
      .sl-muted{color:#9db0cf}
      .sl-good{color:#16a34a}.sl-warn{color:#f59e0b}.sl-bad{color:#ef4444}
      .sl-link{color:#60a5fa;text-decoration:none}.sl-link:hover{text-decoration:underline}
      .sl-kbd{border:1px solid #1f2a3a;border-bottom-width:2px;background:#0c1320;padding:0 6px;border-radius:6px}
    `);
    document.head.appendChild(s);
  };

  const toast = (msg) => {
    let t = qs("#toast");
    if (!t) {
      t = el("div", { id: "toast", class: "toast", style: {position:"fixed",right:"16px",bottom:"16px",background:"#0b1220",border:"1px solid #1f2a3a",padding:"12px 14px",borderRadius:"12px",boxShadow:"0 8px 28px rgba(0,0,0,.35)",display:"none",zIndex:99999} });
      document.body.appendChild(t);
    }
    t.innerText = msg;
    t.style.display = "block";
    t.classList.add("show");
    setTimeout(() => { t.classList.remove("show"); t.style.display = "none"; }, 2200);
  };

  // --- seasonal flavor exposed ---
  window.SL_FLAVOR = window.SL_FLAVOR || {
    Spring: ["Green banners wave; new blood seeks glory.", "Rivalries thaw then ignite anew.", "Spry footwork and daring feints earn roars."],
    Summer: ["Heat-shimmer over steel—endurance decides legends.", "Crowds crave flourish; Slashers bask in cheers.", "Bashers batter shields like thunder beyond the dunes."],
    Fall:   ["Leaves fall; reputations rise or crumble.", "Measured ripostes decide tight bouts.", "Whispers of champions to come."],
    Winter: ["Breath fogs; every lunge risks frostbitten folly.", "Parry lines harden—Total Parry thrives.", "Only the stubborn survive the cold grind."]
  };

  // --- demo-safe save readers ---
  function readSave() {
    try { 
      const raw = localStorage.getItem("sl.save");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch { return null; }
  }

  function ensureDemoRoster() {
    const styles = ["BASHING ATTACK","LUNGING ATTACK","PARRY-LUNGE","TOTAL PARRY","PARRY RIPOSTE","STRIKING ATTACK","SLASHING ATTACK","PARRY-STRIKE","AIMED BLOW","WALL OF STEEL"];
    const mk = (i) => ({
      id:"D"+(1000+i),
      name:["ARUL","ORCREST","SABLE","EIDOLON","CYPRUS","VEX","RIME","LAEL","JARIN","BRAX"][i%10] + " " + ["IRONHAND","SWIFT","EMBER","GALE","NIGHT","BRIGHT","FALL","VAIL","SUN","MOON"][ (i*3)%10 ],
      style:styles[i%styles.length],
      fame: Math.floor(Math.random()*8),
      popularity: Math.floor(Math.random()*8),
      record: {w: Math.floor(Math.random()*8)+2, l: Math.floor(Math.random()*8), k: Math.floor(Math.random()*2)},
      stable: "House AI"
    });
    const roster = Array.from({length: 12}, (_,i)=>mk(i));
    return { stables:[{id:"S-AI", name:"House AI", owner:"The Arena", roster }], weeks: 1, recentFights: [] };
  }

  function getRoster() {
    const s = readSave();
    if (s?.stables?.length) {
      const all = s.stables.flatMap(st => st.roster?.map(w => ({ ...w, stable: st.name })) || []);
      if (all.length) return all;
    }
    const demo = ensureDemoRoster();
    return demo.stables[0].roster;
  }

  // --- Tournament model (simple, 8 or 16 entrants) ---
  const Tournament = {
    current: null,
    load() {
      try {
        const raw = localStorage.getItem("sl.tournament.current");
        this.current = raw ? JSON.parse(raw) : null;
      } catch { this.current = null; }
      return this.current;
    },
    save() {
      localStorage.setItem("sl.tournament.current", JSON.stringify(this.current));
    },
    clear() { localStorage.removeItem("sl.tournament.current"); this.current = null; },
    seasonFromDate(d=new Date()) {
      const m = d.getMonth(); // 0-11
      if (m<=1 || m===11) return "Winter";
      if (m<=4) return "Spring";
      if (m<=7) return "Summer";
      return "Fall";
    },
    seed(entrants, season) {
      const score = (w) => (w.record?.w||0)*2 + (w.fame||0) + (w.popularity||0);
      const sorted = [...entrants].sort((a,b)=> score(b)-score(a));
      const size = Math.min(16, Math.pow(2, Math.ceil(Math.log2(Math.max(sorted.length,8)))));
      const take = sorted.slice(0, size).map((w,i)=> ({ seed:i+1, ...w }));
      const pairs = [];
      for (let i=0;i<take.length/2;i++) pairs.push([take[i], take[take.length-1-i]]);
      this.current = { id: "TOUR-" + Date.now(), season, createdAt: now(), bracket: [pairs], winners: [], log: [] };
      this.save();
      return this.current;
    },
    styleEdge(aStyle, bStyle) {
      const e = {
        "LUNGING ATTACK":{"BASHING ATTACK": 2},
        "PARRY RIPOSTE":{"SLASHING ATTACK":1,"BASHING ATTACK":1},
        "PARRY-LUNGE":{"SLASHING ATTACK":1},
        "WALL OF STEEL":{"STRIKING ATTACK":1},
        "TOTAL PARRY":{"LUNGING ATTACK":1},
        "AIMED BLOW":{"TOTAL PARRY":1},
        "STRIKING ATTACK":{"AIMED BLOW":1},
        "SLASHING ATTACK":{"TOTAL PARRY":-1},
        "BASHING ATTACK":{"TOTAL PARRY":-1},
      };
      return (e[aStyle]?.[bStyle]||0) - (e[bStyle]?.[aStyle]||0);
    },
    fight(a,b) {
      const score = (w)=> (w.record?.w||0)*2 + (w.fame||0) + (w.popularity||0);
      const sa = score(a), sb = score(b);
      const edge = this.styleEdge(a.style, b.style)*0.06;
      const pa = 0.5 + (sa-sb)/(sa+sb+1)*0.35 + edge;
      const winA = Math.random() < pa;
      const winner = winA ? a : b;
      const loser = winA ? b : a;
      const flashy = Math.random() < 0.25 ? ["dazzling feints","thunderous finish","perfect riposte","leaping strike"][Math.floor(Math.random()*4)] : null;
      const kill = Math.random() < 0.06;
      const line = `${winner.name} (${winner.style}) ${flashy? "won with "+flashy : "defeated"} ${loser.name} (${loser.style})${kill? " by a brutal finish":""}.`;
      return { winner, loser, kill, flashy, line };
    },
    runRound() {
      if (!this.current) return null;
      const last = this.current.bracket[this.current.bracket.length-1];
      const next = [];
      const recap = [];
      for (const [a,b] of last) {
        const r = this.fight(a,b);
        next.push(r.winner);
        recap.push(r);
      }
      // pair next
      const nextPairs = [];
      for (let i=0;i<next.length;i+=2) nextPairs.push([next[i], next[i+1]]);
      if (nextPairs.length) this.current.bracket.push(nextPairs);
      this.current.log.push({ round: this.current.bracket.length-1, fights: recap, at: now() });
      if (nextPairs.length===0) this.current.champion = next[0];
      this.save();
      return { nextPairs, recap };
    }
  };

  // --- Newsletter model ---
  const Newsletter = {
    latest: null,
    load() {
      try { const raw = localStorage.getItem("sl.newsletter.latest"); this.latest = raw? JSON.parse(raw): null; }
      catch { this.latest = null; }
      return this.latest;
    },
    publishFromTournament(t) {
      const season = t.season;
      const flavor = (window.SL_FLAVOR?.[season]||[])[Math.floor(Math.random()*3)] || "";
      const fights = t.log.flatMap(r => r.fights.map(f => f.line));
      const champ = t.champion ? `${t.champion.name} of ${t.champion.stable||"the Arena"} claims the ${season} crown!` : "A champion will be decided soon.";
      const meta = arenaMetaSnapshot();
      this.latest = {
        id: "NEWS-"+Date.now(),
        title: `Stable Lords Ledger — ${season} Issue`,
        createdAt: now(),
        lead: flavor,
        recap: fights,
        championLine: champ,
        meta,
      };
      localStorage.setItem("sl.newsletter.latest", JSON.stringify(this.latest));
      return this.latest;
    }
  };

  function arenaMetaSnapshot() {
    const save = readSave();
    const fights = save?.recentFights || [];
    const styleCounts = {};
    for (const f of fights) {
      [f.aStyle, f.dStyle].forEach(s => { if (!s) return; styleCounts[s] = (styleCounts[s]||0)+1; });
    }
    const items = Object.entries(styleCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([s,c])=>`${s}: ${c}`);
    const lines = [
      "Edge: Parry styles trending as Lungers spike; Total Parry steady.",
      "Flashy Moments: Slasher flourishes, Riposte steals, Lunger ambushes.",
      "Kill Rate: Low—referees watchful, precision over brutality.",
      "Crowd Taste: Striking & Lunging remain theater favorites."
    ];
    return { items, lines };
  }

  // --- UI / Modals ---
  function showModal(node) {
    injectStyles();
    const wrap = el("div", { class:"sl-modal-backdrop", onclick:(e)=>{ if (e.target===wrap) document.body.removeChild(wrap);} },
      el("div", { class:"sl-modal" }, node)
    );
    document.body.appendChild(wrap);
  }

  function tournamentsModal() {
    const roster = getRoster();
    let season = Tournament.seasonFromDate();
    const header = el("div", { class:"sl-head" },
      el("div", { class:"sl-title" }, "Seasonal Tournament"),
      el("div", {}, el("span", { class:"sl-badge" }, VERSION),
        " ",
        el("button", { class:"sl-btn", onclick:()=>document.body.removeChild(backdrop) }, "Close"))
    );
    const seasonSel = el("select", { class:"sl-input" }, ...["Spring","Summer","Fall","Winter"].map(s => el("option", { value:s, selected: s===season? "selected": null }, s)));
    seasonSel.addEventListener("change", ()=> { season = seasonSel.value; });
    const entrantsCol = el("div", { class:"sl-col" },
      el("div", { class:"sl-card" },
        el("div", { class:"sl-row" }, el("strong", {}, "Entrants"), el("span", {class:"sl-muted"}, "(top 8–16 by seed)")),
        el("div", { class:"sl-list", id:"sl-entrants" },
          ...roster.slice(0,16).map(w => el("div", { class:"sl-item" },
            el("div", {}, w.name, " ", el("span", { class:"sl-chip"}, w.style)),
            el("div", {}, el("span", { class:"sl-chip" }, "W", w.record?.w||0), " ",
              el("span", { class:"sl-chip" }, "Fame ", w.fame||0), " ",
              el("span", { class:"sl-chip" }, "Pop ", w.popularity||0)
            )
          ))
        )
      )
    );
    const bracketCol = el("div", { class:"sl-col" },
      el("div", { class:"sl-card" },
        el("div", { class:"sl-row" }, el("strong", {}, "Bracket Preview"), el("span", {class:"sl-muted"}, "(seed vs seed)")),
        el("div", { id:"sl-bracket" }, el("div", { class:"sl-muted" }, "No bracket yet."))
      ),
      el("div", { class:"sl-card" },
        el("div", { class:"sl-row" }, el("strong", {}, "Round Recap")),
        el("div", { id:"sl-recap" }, el("div", { class:"sl-muted" }, "No fights yet."))
      )
    );

    const body = el("div", { class:"sl-body" }, 
      el("div", {}, el("label", { class:"sl-muted" }, "Season"), seasonSel),
      el("div", {}),
      entrantsCol, bracketCol
    );

    const btnSeed = el("button", { class:"sl-btn", onclick: () => {
      const t = Tournament.seed(roster, season);
      toast(`Seeded ${t.bracket[0].length*2} entrants for the ${season} Tournament.`);
      renderBracket();
    }}, "Seed");
    const btnRun = el("button", { class:"sl-btn", onclick: () => {
      const t = Tournament.load();
      if (!t?.bracket?.length) { toast("Seed first."); return; }
      const r = Tournament.runRound();
      if (!r) { toast("No tournament active"); return; }
      renderBracket();
      renderRecap();
      if (Tournament.current?.champion) {
        const issue = Newsletter.publishFromTournament(Tournament.current);
        toast(`${Tournament.current.champion.name} is crowned! Newsletter published.`);
        renderRecap();
      }
    }}, "Run Round");

    const footer = el("div", { class:"sl-footer" },
      el("button", { class:"sl-btn", onclick: () => { Tournament.clear(); qs("#sl-bracket").innerHTML = "<div class='sl-muted'>Cleared.</div>"; qs("#sl-recap").innerHTML = "<div class='sl-muted'>No fights yet.</div>"; toast("Tournament cleared."); } }, "Clear"),
      el("button", { class:"sl-btn", onclick: () => { const t = Tournament.load(); if (!t) { toast("Nothing to export."); return; } const issue = Newsletter.publishFromTournament(t); navigator.clipboard?.writeText(JSON.stringify(issue, null, 2)); toast("Newsletter JSON copied."); } }, "Export Newsletter JSON"),
      btnSeed,
      btnRun
    );

    const modal = el("div", {}, header, body, footer);
    const backdrop = el("div", { class:"sl-modal-backdrop" },
      el("div", { class:"sl-modal" }, modal)
    );
    document.body.appendChild(backdrop);

    function renderBracket() {
      const t = Tournament.load();
      const host = qs("#sl-bracket");
      if (!t) { host.innerHTML = "<div class='sl-muted'>No bracket yet.</div>"; return; }
      host.innerHTML = "";
      t.bracket.forEach((round, idx) => {
        const col = el("div", { class:"sl-card" }, el("div", { class:"sl-row" }, el("strong", {}, `Round ${idx+1}`)));
        round.forEach(pair => {
          const [a,b] = pair;
          col.appendChild(el("div", { class:"sl-item" },
            el("div", {}, `#${a.seed} ${a.name}`),
            el("div", {}, "vs"),
            el("div", {}, `#${b.seed} ${b.name}`),
          ));
        });
        host.appendChild(col);
      });
      if (t.champion) host.appendChild(el("div", { class:"sl-item" }, el("strong", {}, "Champion: ", t.champion.name)));
    }

    function renderRecap() {
      const t = Tournament.load();
      const host = qs("#sl-recap");
      if (!t?.log?.length) { host.innerHTML = "<div class='sl-muted'>No fights yet.</div>"; return; }
      host.innerHTML = "";
      t.log.forEach(r => {
        const card = el("div", { class:"sl-card" }, el("div", { class:"sl-row" }, el("strong", {}, `Round ${r.round+1} Recap`)));
        r.fights.forEach(f => card.appendChild(el("div", { class:"sl-item" }, f.line)));
        host.appendChild(card);
      });
    }
  }

  function newsletterModal() {
    const issue = Newsletter.load();
    const head = el("div", { class:"sl-head" },
      el("div", { class:"sl-title" }, issue?.title || "Stable Lords Ledger"),
      el("div", {}, el("span", { class:"sl-badge" }, VERSION), " ",
        el("button", { class:"sl-btn", onclick:()=>document.body.removeChild(backdrop)}, "Close"))
    );

    const lead = el("div", { class:"sl-card" }, el("div", { class:"sl-row" }, el("strong", {}, "Lead:")), el("div", {}, issue?.lead || "No newsletter yet. Run a tournament round."));
    const recap = el("div", { class:"sl-card" }, el("div", { class:"sl-row" }, el("strong", {}, "Recap:")), el("div", { class:"sl-list" }, ...(issue?.recap?.length? issue.recap.map(x => el("div", { class:"sl-item" }, x)) : [el("div", { class:"sl-muted" }, "No recap yet.")])));
    const champ = el("div", { class:"sl-card" }, el("div", { class:"sl-row" }, el("strong", {}, "Champion")), el("div", {}, issue?.championLine || "—"));
    const meta = el("div", { class:"sl-card" }, el("div", { class:"sl-row" }, el("strong", {}, "Arena Meta Snapshot")),
      el("div", { class:"sl-muted" }, issue?.meta?.lines?.join(" ") || "—"),
      el("div", { class:"sl-row" }, ...(issue?.meta?.items || []).map(t => el("span", { class:"sl-chip" }, t)))
    );

    const body = el("div", { class:"sl-body" }, lead, recap, champ, meta);
    const footer = el("div", { class:"sl-footer" },
      el("button", { class:"sl-btn", onclick: ()=> { const data = Newsletter.load(); if (!data) { toast("Nothing to export."); return; } navigator.clipboard?.writeText(JSON.stringify(data, null, 2)); toast("Copied newsletter JSON."); } }, "Copy JSON"),
      el("a", { class:"sl-btn sl-link", href:"#", onclick:(e)=>{ e.preventDefault(); const text = (Newsletter.load()? (Newsletter.load().recap||[]).join("\n"): "No recap."); navigator.clipboard?.writeText(text); toast("Copied recap text."); } }, "Copy Recap Text")
    );

    const modal = el("div", {}, head, body, footer);
    const backdrop = el("div", { class:"sl-modal-backdrop" },
      el("div", { class:"sl-modal" }, modal)
    );
    document.body.appendChild(backdrop);
  }

  // --- Wire nav buttons ---
  function ensureNavHook() {
    const nav = qs(".nav");
    if (!nav) return;
    // attach to existing Tournaments button if present
    const hasTour = qsa("button", nav).find(b => /tournaments/i.test(b.getAttribute("data-nav") || b.textContent || ""));
    if (hasTour && !hasTour._sl_hooked) {
      hasTour.addEventListener("click", (e) => { e.preventDefault(); tournamentsModal(); });
      hasTour._sl_hooked = true;
    } else if (!hasTour) {
      const btn = el("button", { class:"btn", "data-nav":"tournaments", onclick:(e)=>{ e.preventDefault(); tournamentsModal(); }}, "Tournaments");
      nav.appendChild(btn);
    }
    // add Newsletter button
    let newsBtn = qsa("button", nav).find(b => /newsletter/i.test(b.textContent||""));
    if (!newsBtn) {
      newsBtn = el("button", { class:"btn", onclick:(e)=>{ e.preventDefault(); newsletterModal(); }}, "Newsletter");
      nav.appendChild(newsBtn);
    }
    // bump chip version if visible
    const chip = qs(".chip");
    if (chip && /Quickstart/.test(chip.textContent||"")) {
      chip.textContent = chip.textContent.replace(/v[\d.]+/, VERSION);
    }
  }

  // On load
  ensureNavHook();
  toast("Delta loaded: Newsletter + Tournament modals");
  // Re-ensure after small delay (in case SPA rerenders nav)
  setTimeout(ensureNavHook, 800);
  setTimeout(ensureNavHook, 2000);
})();
