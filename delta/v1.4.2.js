
// Stable Lords — Delta v1.4.2 (safe additive plugin)
// - Adds a floating "Meta" + "Help" buttons
// - Meta Snapshot modal (style counts, trend highlights)
// - Help modal with OE vs AL primer and class blurbs
// - Seasonal flavor lines for tournaments (available via window.SL_FLAVOR)
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const el = (tag, props={}, children=[]) => {
    const n = document.createElement(tag);
    Object.entries(props).forEach(([k,v])=>{
      if (k === "class") n.className = v;
      else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2).toLowerCase(), v);
      else n.setAttribute(k,v);
    });
    (Array.isArray(children)?children:[children]).filter(Boolean).forEach(c=>{
      if (typeof c === "string") n.appendChild(document.createTextNode(c)); else n.appendChild(c);
    });
    return n;
  };
  const toast = (msg) => {
    const t = $("#toast") || el("div",{id:"toast",class:"toast"},[]);
    if (!t.parentNode) document.body.appendChild(t);
    t.textContent = msg; t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"), 2400);
  };

  // Seasonal flavor (used by newsletter/tournament UIs)
  window.SL_FLAVOR = {
    Spring: [
      "Blossoms fall like confetti as steel sings in the vernal air.",
      "Fresh recruits brim with bravado; veterans test the thaw with measured strikes."
    ],
    Summer: [
      "Heat-haze shimmers; tempers rise — slashes flash like lightning.",
      "Crowds roar for spectacle. Lungers thrive; parry artists keep their cool."
    ],
    Fall: [
      "Crisp winds favor patience — ripostes bite as leaves turn.",
      "Basher hammers echo like harvest drums."
    ],
    Winter: [
      "Breath turns to mist; duels grind — endurance tells the tale.",
      "Shields creak; Total Parry stands like stone against the gale."
    ]
  };

  // Help content
  const tips = {
    oeal: [
      "**Offensive Effort (OE)** — how hard you try to score hits. Higher OE → more swings, more fatigue, weaker defense.",
      "**Activity Level (AL)** — how much footwork/motion you keep. Higher AL → more initiative/tempo, also more fatigue.",
      "Quick mental model: OE = aggression; AL = movement. A Basher might hit hard at OE 9, AL 4; a Lunger at OE 10, AL 8."
    ],
    classes: [
      "**Bashing Attack** — strength-first, heavy weapons. Low AL, high OE. Struggles vs nimble ripostes.",
      "**Lunging Attack** — burst speed; thrives at high AL. Guard stamina.",
      "**Parry-Lunge** — defense-first feints that turn into sudden lunges. Balanced OE/AL.",
      "**Parry-Riposte** — provoke, then punish. Lower OE can be *more* attacks (via ripostes).",
      "**Slashing/Striking** — lighter on stamina; clean, economical offense.",
      "**Total Parry** — win by denial and precision. Patience is your blade.",
      "**Aimed Blow** — fewer swings, surgical targets. Loves light gear.",
      "**Wall of Steel** — relentless arc control. Great stamina needed."
    ]
  };

  // Seed-friendly helper
  function getSave() {
    try {
      const raw = localStorage.getItem("stablelords_save");
      return raw ? JSON.parse(raw) : null;
    } catch(e) { return null; }
  }

  // Aggregate a basic meta snapshot safely
  function computeMeta() {
    const save = getSave();
    const out = { styleCounts: {}, flashy: 0, kills: 0, total: 0 };
    const styles = [
      "BASHING ATTACK","STRIKING ATTACK","SLASHING ATTACK","PARRY-STRIKE",
      "LUNGING ATTACK","PARRY-LUNGE","WALL OF STEEL","TOTAL PARRY",
      "AIMED BLOW","PARRY RIPOSTE"
    ];
    styles.forEach(s => out.styleCounts[s]=0);
    if (!save) return out;
    const roster = (save?.player?.roster || []).concat(...(save?.aiStables||[]).map(s=>s.roster||[]));
    roster.forEach(w => { if (w?.style && out.styleCounts[w.style] != null) out.styleCounts[w.style] += 1; });
    const fights = save?.history?.recentFights || [];
    fights.forEach(f => {
      out.total += 1;
      if (f?.tags?.includes?.("Kill")) out.kills += 1;
      if (f?.tags?.some?.(t => t.includes("Flashy"))) out.flashy += 1;
    });
    return out;
  }

  function renderMetaModal() {
    const m = el("div",{class:"modal",id:"metaModal"},[
      el("div",{class:"card"},[
        el("div",{class:"rowb"},[
          el("div",{class:"title"},["Arena Meta Snapshot"]),
          el("button",{class:"btn",onClick:()=>m.classList.remove("show")},["Close"])
        ]),
        el("div",{class:"muted",style:"margin-bottom:8px"},["Auto-updated from your local save."]),
        (function(){
          const snap = computeMeta();
          const list = el("div",{class:"list"});
          Object.entries(snap.styleCounts).forEach(([style,count])=>{
            list.appendChild(el("div",{class:"rowb"},[
              el("div",{},[style]),
              el("span",{class:"chip"},[String(count)])
            ]));
          });
          const extras = el("div",{class:"row",style:"margin-top:8px"},[
            el("span",{class:"pill"},[`Fights tracked: ${snap.total}`]),
            el("span",{class:"pill"},[`Kills: ${snap.kills}`]),
            el("span",{class:"pill"},[`Flashy moments: ${snap.flashy}`])
          ]);
          return el("div",{},[list, extras]);
        })()
      ])
    ]);
    document.body.appendChild(m);
    return m;
  }

  function renderHelpModal() {
    const m = el("div",{class:"modal",id:"helpModal"},[
      el("div",{class:"card"},[
        el("div",{class:"rowb"},[
          el("div",{class:"title"},["Stable Lords Help"]),
          el("button",{class:"btn",onClick:()=>m.classList.remove("show")},["Close"])
        ]),
        el("div",{class:"list"},[
          el("div",{},["\u{1F4AA}  OE vs AL"]),
          el("ul",{},tips.oeal.map(t => el("li",{},[t]))),
          el("div",{style:"height:8px"}),
          el("div",{},["\u{1F5E1}\uFE0F  Class Quick Takes"]),
          el("ul",{},tips.classes.map(t => el("li",{},[t]))),
        ])
      ])
    ]);
    document.body.appendChild(m);
    return m;
  }

  // Floating buttons
  const fab = el("div",{class:"fab"},[
    el("button",{class:"btn",id:"btnMeta"},["Meta"]),
    el("button",{class:"btn",id:"btnHelp"},["Help"]),
  ]);
  document.body.appendChild(fab);

  const meta = renderMetaModal();
  const help = renderHelpModal();
  $("#btnMeta").addEventListener("click", ()=>{ meta.classList.add("show"); });
  $("#btnHelp").addEventListener("click", ()=>{ help.classList.add("show"); });
  document.addEventListener("keydown",(e)=>{
    if (e.key === "?") help.classList.add("show");
    if (e.key === "Escape") { help.classList.remove("show"); meta.classList.remove("show"); }
  });

  // Friendly startup toast
  toast("Delta v1.4.2 loaded — Meta & Help available (bottom-left).");
})();
