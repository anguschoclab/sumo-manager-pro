// Stable Lords delta v1.4.4
// - Robust el() helper
// - Restores Run Round + Seed Demo controls
// - Fixes Tournaments modal to only append Nodes
// - Updates header chip to show version

(function(){
  // --- Robust element builder: tolerates arrays, strings, nulls, booleans ----
  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);

    // map special props
    for (const [k, v] of Object.entries(props || {})) {
      if (v == null || v === false) continue;
      if (k === "class" || k === "className") node.className = String(v);
      else if (k === "style" && typeof v === "object") Object.assign(node.style, v);
      else if (k.startsWith("data-")) node.setAttribute(k, String(v));
      else if (/^on[A-Z]/.test(k) && typeof v === "function") {
        node.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k in node) {
        try { node[k] = v; } catch { node.setAttribute(k, String(v)); }
      } else {
        node.setAttribute(k, String(v));
      }
    }

    // append children robustly
    const append = (c) => {
      if (c == null || c === false) return;
      if (Array.isArray(c)) { c.forEach(append); return; }
      if (c instanceof Node) { node.appendChild(c); return; }
      node.appendChild(document.createTextNode(String(c)));
    };
    children.forEach(append);

    return node;
  }

  // Simple toast utility (uses #toast in index.html)
  function toast(msg) {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    window.clearTimeout(t.__hide);
    t.__hide = window.setTimeout(() => t.classList.remove("show"), 1800);
  }

  // Version chip updater
  function ensureVersionChip(label = "Stable Lords v1.4.4") {
    const nav = document.querySelector(".nav");
    if (!nav) return;
    let chip = nav.querySelector(".chip");
    if (!chip) {
      chip = el("span", { className: "chip" }, label);
      nav.appendChild(chip);
    } else {
      chip.textContent = label;
    }
  }

  // Wire up nav buttons if missing
  function ensureCoreControls() {
    const nav = document.querySelector(".nav");
    if (!nav) return;

    // Re-add: Run Round
    if (!nav.querySelector('[data-nav="run-week"]') && !nav.querySelector('[data-nav="runround-action"]')) {
      nav.appendChild(
        el("button", {
          className: "btn",
          "data-nav": "runround-action",
          onClick: () => {
            try {
              if (window.dmSim?.runRound) { window.dmSim.runRound(); toast("Round simulated."); return; }
              if (window.Save?.weeklyTick) { window.Save.weeklyTick(); toast("Week advanced."); return; }
            } catch (e) { console.error(e); toast("Run Round failed."); return; }
            toast("Run Round requires the core sim; feature pending in this build.");
          }
        }, "Run Round")
      );
    }

    // Re-add: Seed Demo
    if (!nav.querySelector('[data-nav="seed-demo"]')) {
      nav.appendChild(
        el("button", {
          className: "btn secondary",
          "data-nav": "seed-demo",
          onClick: () => {
            if (window.Save?.seedDemo) {
              try { window.Save.seedDemo(); toast("Demo stables seeded."); }
              catch (e) { console.error(e); toast("Seeding failed."); }
              return;
            }
            try {
              const k = "sl_save";
              const save = JSON.parse(localStorage.getItem(k) || "{}");
              if (!save.stables) {
                localStorage.setItem(k, JSON.stringify({
                  ...save,
                  stables: [{ id: "player", name: "Stable Lords", warriors: [] }],
                  version: (save.version || "1.4.4")
                }));
                toast("Local demo save initialized.");
              } else {
                toast("Demo data already present.");
              }
            } catch (e) { console.error(e); toast("Seeding unavailable in this build."); }
          }
        }, "Seed Demo")
      );
    }
  }

  function tournamentsModal() {
    const seasons = [
      { id: "spring",  name: "Spring Cup"  },
      { id: "summer",  name: "Summer Grand" },
      { id: "fall",    name: "Fall Classic" },
      { id: "winter",  name: "Winter Crown" },
    ];

    const list = el("div", { className: "list" },
      seasons.map(s =>
        el("div", { className: "rowb card" },
          el("div", null,
            el("div", { className: "title" }, s.name),
            el("div", { className: "muted" }, `Seasonal tournament — ${s.id}`)
          ),
          el("div", { className: "row" },
            el("button", {
              className: "btn",
              onClick: () => {
                if (window.Tourney?.open) { try { window.Tourney.open(s.id); toast(`${s.name} opened.`); } catch(e){console.error(e); toast("Open failed.");} return; }
                toast("Tournament module not wired in this build.");
              }
            }, "Open"),
            el("button", {
              className: "btn secondary",
              onClick: () => {
                if (window.Tourney?.seed) { try { window.Tourney.seed(s.id); toast(`${s.name}: seeded entrants.`); } catch(e){console.error(e); toast("Seeding failed.");} return; }
                toast("Seeding not available in this build.");
              }
            }, "Seed")
          )
        )
      )
    );

    const wrapper = el("div", { className: "card" },
      el("div", { className: "h" }, el("div", { className: "title" }, "Seasonal Tournaments")),
      list
    );
    return wrapper;
  }

  // Augment the existing "Tournaments" button to open the modal
  function wireTournamentsButton() {
    const btn = document.querySelector('button[data-nav="tournaments"]');
    const app = document.getElementById("app");
    if (!btn || !app) return;
    btn.addEventListener("click", () => {
      // Clear and render the tournaments view (simple non-modal swap for Quickstart)
      app.innerHTML = "";
      app.appendChild(tournamentsModal());
    }, { once: true });
  }

  function boot() {
    ensureVersionChip();
    ensureCoreControls();
    wireTournamentsButton();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
