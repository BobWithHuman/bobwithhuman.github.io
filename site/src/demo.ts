// The demo you drive, laid out like a Claude Code session: the transcript, the input box, the status line.
// Pick a prompt, type it, send it. Calls you asked for run; WithHuman holds the rest, and asks you about some.
import gsap from "gsap";
import { $, $$, esc, fine, q, reduced, still } from "./lib";
import { ICON } from "./icons";
import { graphFor, SCENARIOS, type Scenario, type Step } from "./data";

type Phase = "idle" | "run" | "ask";

export function initDemo() {
  const pin = $("#demo-pin"), win = $("#win"), term = $("#term"), frame = $<HTMLIFrameElement>("#gframe");
  term.innerHTML = `<div class="tx" id="tx"></div><div class="sug" id="sug"></div><div class="ibox" id="ibox"></div>
    <div class="foot"><span class="mode"><i></i>WithHuman on · enforce</span><span class="keys" id="keys"></span></div>`;
  const tx = $("#tx", term), sug = $("#sug", term), ibox = $("#ibox", term), keys = $("#keys", term);

  let sel = 0, typed = 0, phase: Phase = "idle", at = -1, picks: Record<number, "yes" | "no"> = {}, choice = 0;
  let sc: Scenario = SCENARIOS[0], shown: Scenario | null = null, timer = 0, ready = false, inView = false, auto: gsap.core.Tween | null = null, started = false;
  let runEl: HTMLElement | null = null;

  const waitGraph = () => { try { if ((frame.contentWindow as any)?.WHRecord) { ready = true; draw(); return; } } catch {} setTimeout(waitGraph, 80); };
  waitGraph();
  const draw = () => { if (ready && shown && at >= 0) try { (frame.contentWindow as any).WHRecord.render(graphFor(shown, at, picks)); } catch {} };

  const status = () => {
    $("#gwait").style.opacity = shown ? "0" : "1";
    draw();
  };

  // ---- The input box, the suggestions above it, the hints in the status line ----
  const prompt = () => SCENARIOS[sel].prompt;
  const paintInput = () => {
    const p = prompt(), idle = phase === "idle";
    ibox.classList.toggle("off", !idle);
    ibox.innerHTML = idle
      ? `<span class="gt">&gt;</span><span class="me">${esc(p.slice(0, typed))}</span><span class="caret-t"></span><span class="ghost">${esc(p.slice(typed))}</span>${typed >= p.length ? `<button class="send" id="send">${ICON.enter}</button>` : ""}`
      : `<span class="gt">&gt;</span><span class="ghost">${phase === "ask" ? "Waiting for your answer above" : "esc to interrupt"}</span>`;
    sug.innerHTML = idle ? SCENARIOS.map((s, i) => `<button class="${i === sel ? "on" : ""}" data-i="${i}">${esc(s.label)}</button>`).join("") : "";
    sug.classList.toggle("off", !idle);
    keys.innerHTML = idle ? (fine ? "<kbd>↑↓</kbd> prompts · <kbd>tab</kbd> fill · <kbd>⏎</kbd> send" : "tap the box to type")
      : phase === "ask" ? "<kbd>↑↓</kbd> choose · <kbd>⏎</kbd> confirm · <kbd>esc</kbd> no" : "running…";
    $("#send", ibox)?.addEventListener("click", send);
    $$("button", sug).forEach((b) => b.addEventListener("click", () => { pick(+b.dataset.i!); fill(); }));
  };
  const pick = (i: number) => { sel = (i + SCENARIOS.length) % SCENARIOS.length; typed = 0; auto?.kill(); paintInput(); };
  const typeTo = (n: number) => { typed = Math.max(0, Math.min(prompt().length, n)); paintInput(); };
  const fill = (then?: () => void) => {
    auto?.kill(); const o = { n: typed }, len = prompt().length;
    auto = gsap.to(o, { n: len, duration: Math.max(.15, (len - typed) * .026), ease: "none", onUpdate: () => typeTo(Math.round(o.n)), onComplete: () => then?.() });
  };

  // ---- The transcript ----
  const add = (html: string, cls = "ln") => {
    const el = document.createElement("div"); el.className = cls; el.innerHTML = html; runEl!.appendChild(el);
    if (!reduced) gsap.from(el, { y: 8, opacity: 0, filter: "blur(4px)", duration: .4, ease: "expo.out" });
    tx.scrollTo({ top: tx.scrollHeight, behavior: reduced ? "auto" : "smooth" });
    return el;
  };
  const spinner = () => add(`<span class="spin"></span><span class="dim">Working…</span>`, "ln work");
  const clearSpin = () => $$(".work", tx).forEach((e) => e.remove());
  const outLines = (s: string) => esc(s).split("\n").map((l, i) => (i ? "   " : "") + l).join("\n");
  const head = (s: Step) => {
    const m = s.head.match(/^([^(]+?)(\s*\(MCP\))?\((.*)\)$/);
    const name = m ? m[1] + (m[2] ?? "") : s.head, arg = m ? m[3] : "";
    return `<span class="dot ${s.v === "allow" ? "" : s.v === "deny" ? "r" : "y"}">⏺</span> <span class="tn">${esc(name)}</span><span class="ar">(${esc(arg)})</span>`;
  };
  const glow = () => { if (still) return; win.classList.remove("hit-b"); void win.offsetWidth; win.classList.add("hit-b"); };

  const step = (i: number) => {
    clearSpin(); at = i;
    if (i >= sc.steps.length) {
      add(`<span class="dot">⏺</span> ${esc(sc.answer)}`);
      phase = "idle"; pick(sel + 1); status(); return;
    }
    const s = sc.steps[i];
    if (s.v === "allow") {
      const out = s.hidden ? outLines(s.out!).replace(esc(s.hidden), `<span class="hid">${esc(s.hidden)}</span>`) : outLines(s.out ?? "");
      add(`${head(s)}<span class="o">⎿  ${out}</span>`);
    } else if (s.v === "deny") {
      glow();
      add(`${head(s)}<span class="o"><span class="err">⎿  Blocked by WithHuman</span> <span class="dim">· ${esc(s.why!)}</span></span>`);
    } else {
      add(head(s)); phase = "ask"; choice = 0; paintAsk(s); paintInput(); status(); return;
    }
    status();
    timer = window.setTimeout(() => { spinner(); timer = window.setTimeout(() => step(i + 1), 650); }, 550);
  };
  // Claude Code's permission prompt, with WithHuman's reason in it.
  let askEl: HTMLElement | null = null;
  const paintAsk = (s: Step) => {
    const html = `<div class="ph">${esc(s.name === "Edit" ? "Edit file" : s.name === "Bash" ? "Bash command" : "Tool use")}</div>
      <div class="pc">${esc(s.args)}</div>
      <div class="pw">${ICON.shield}<span><b>WithHuman</b> ${esc(s.kind!)} · ${esc(s.why!)}</span></div>
      <div class="pq">Do you want to proceed?</div>
      <button class="po${choice === 0 ? " on" : ""}" data-c="0"><span class="cur">❯</span>1. Yes</button>
      <button class="po${choice === 1 ? " on" : ""}" data-c="1"><span class="cur">❯</span>2. No, and tell Claude what to do differently <span class="dim">(esc)</span></button>`;
    if (!askEl) askEl = add(html, "perm"); else askEl.innerHTML = html;
    $$(".po", askEl).forEach((b) => { b.addEventListener("mouseenter", () => { choice = +b.dataset.c!; paintAsk(s); }); b.addEventListener("click", () => answer(+b.dataset.c! === 0 ? "yes" : "no")); });
  };
  const answer = (a: "yes" | "no") => {
    if (phase !== "ask") return;
    const s = sc.steps[at]; picks[at] = a; askEl?.remove(); askEl = null; phase = "run";
    add(a === "yes" ? `<span class="o">⎿  ${outLines(s.out ?? "Done")} <span class="dim">· allowed by you</span></span>` : `<span class="o"><span class="ask">⎿  Denied by you</span> <span class="dim">· ${esc(s.why!)}</span></span>`);
    paintInput(); status();
    timer = window.setTimeout(() => { spinner(); timer = window.setTimeout(() => step(at + 1), 650); }, 500);
  };

  const send = () => {
    if (phase !== "idle") return;
    if (typed < prompt().length) { fill(send); return; }
    sc = SCENARIOS[sel]; shown = sc; picks = {}; at = -1; phase = "run";
    runEl = document.createElement("div"); runEl.className = "turn"; tx.appendChild(runEl);
    add(`<span class="ps">&gt;</span> <span class="me">${esc(sc.prompt)}</span>`, "ln you");
    typed = 0; paintInput(); status(); spinner();
    timer = window.setTimeout(() => step(0), 800);
  };

  // ---- Keys, while the demo is on screen ----
  new IntersectionObserver((es) => (inView = es[0].isIntersecting), { threshold: .4 }).observe(win);
  addEventListener("keydown", (e) => {
    if (!inView || e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest?.("input,textarea")) return;
    if (phase === "ask") {
      if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); choice = choice ? 0 : 1; paintAsk(sc.steps[at]); }
      else if (e.key === "Enter") { e.preventDefault(); answer(choice === 0 ? "yes" : "no"); }
      else if (e.key === "1" || e.key === "y") answer("yes");
      else if (e.key === "2" || e.key === "n" || e.key === "Escape") answer("no");
      return;
    }
    if (phase !== "idle") return;
    if (e.key === "Enter") { e.preventDefault(); send(); }
    else if (e.key === "Tab") { e.preventDefault(); fill(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowDown") { e.preventDefault(); pick(sel + (e.key === "ArrowUp" ? -1 : 1)); }
    else if (e.key === "Backspace") { e.preventDefault(); typeTo(typed - 1); }
    else if (e.key.length === 1 && (e.key !== " " || started)) { e.preventDefault(); started = true; typeTo(typed + 1 + (Math.random() < .3 ? 1 : 0)); }
  });
  ibox.addEventListener("click", (e) => { if (phase === "idle" && !(e.target as HTMLElement).closest("button")) fill(); });

  // The window leans toward the pointer.
  if (fine && !reduced && !still) {
    const rx = gsap.quickTo(win, "rotationX", { duration: .8, ease: "power3" }), ry = gsap.quickTo(win, "rotationY", { duration: .8, ease: "power3" });
    pin.addEventListener("pointermove", (e) => { const r = pin.getBoundingClientRect(); ry(((e.clientX - r.left) / r.width - .5) * 3); rx(-((e.clientY - r.top) / r.height - .5) * 2); });
    pin.addEventListener("pointerleave", () => { rx(0); ry(0); });
  }

  // The graph takes the wheel for zooming; it sits behind a cover until clicked, so the page keeps scrolling.
  const cover = $("#shield-g");
  cover.addEventListener("click", () => cover.classList.add("off"));
  $("#graph").addEventListener("pointerleave", () => cover.classList.remove("off"));

  paintInput(); status();
  if (still) { sel = +(q.get("sc") || 0); typed = prompt().length; send(); }
}
