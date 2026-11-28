// The hero: a field of the text agents read, a lens that shows the orders hidden in it, and the headline.
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { $, clamp, fine, fitCanvas, reduced, still, whileVisible } from "./lib";
import { CORPUS } from "./data";

type Cell = { c: string; hid: number }; // hid: index of the hidden line this char belongs to, or -1

export function initField() {
  const cv = $<HTMLCanvasElement>("#field"), hero = $(".hero"), tag = $("#lens-tag");
  let ctx: CanvasRenderingContext2D, W = 0, H = 0, dpr = 1, cw = 8, ch = 20, cols = 0, rows = 0;
  let grid: Cell[][] = [], hiddenLines: { r: number; c0: number; c1: number }[] = [], base: HTMLCanvasElement;
  const FONT = '500 13px "Geist Mono", ui-monospace, monospace', FONT_B = '700 13px "Geist Mono", ui-monospace, monospace';
  const GLYPHS = "#%&@$/<>{}[]=+*?!~^";

  const build = () => {
    ({ ctx, w: W, h: H, dpr } = fitCanvas(cv));
    ctx.font = FONT; cw = ctx.measureText("M").width; ch = 21;
    cols = Math.ceil(W / cw) + 1; rows = Math.ceil(H / ch) + 1;
    grid = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ c: " ", hid: -1 })));
    hiddenLines = [];
    // Text set in columns, like documents side by side, each starting somewhere else in the corpus.
    const colW = Math.max(46, Math.min(72, Math.floor(cols / Math.max(1, Math.round(cols / 64)))));
    for (let x0 = 1; x0 < cols; x0 += colW) {
      let li = Math.floor(Math.random() * CORPUS.length);
      for (let r = 0; r < rows; r++) {
        let line = CORPUS[li++ % CORPUS.length];
        const hid = line.startsWith("!"); if (hid) line = line.slice(1);
        const indent = line.startsWith(" ") ? 0 : Math.random() < .2 ? 2 : 0;
        const text = line.slice(0, colW - 4 - indent);
        const id = hid ? hiddenLines.push({ r, c0: x0 + indent, c1: x0 + indent + text.length }) - 1 : -1;
        for (let i = 0; i < text.length; i++) { const c = x0 + indent + i; if (c < cols) grid[r][c] = { c: text[i], hid: id }; }
      }
    }
    // Everything drawn once, faint: hidden lines look like any other line.
    base = document.createElement("canvas"); base.width = cv.width; base.height = cv.height;
    const b = base.getContext("2d")!; b.setTransform(dpr, 0, 0, dpr, 0, 0); b.font = FONT; b.textBaseline = "middle"; b.textAlign = "center";
    b.fillStyle = "rgba(20,18,15,.11)";
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const g = grid[r][c]; if (g.c !== " ") b.fillText(g.c, c * cw + cw / 2, r * ch + ch / 2); }
  };

  let lx = 0, ly = 0, tx = 0, ty = 0, lastMove = -1e9, visible = true, t0 = performance.now();
  const reveal: number[] = []; // per hidden line, how lit it is after a scan passed
  const ripples: { x: number; y: number; t: number }[] = [];
  const ping = (x: number, y: number) => ripples.push({ x, y, t: performance.now() });

  const drawChar = (g: Cell, px: number, py: number, s: number) => {
    ctx.setTransform(dpr * s, 0, 0, dpr * s, dpr * px, dpr * py); ctx.fillText(g.c, 0, 0);
  };

  const frame = (now: number) => {
    if (!visible) return;
    requestAnimationFrame(frame);
    const t = (now - t0) / 1000;
    if (now - lastMove > 2600 || !fine) { tx = W * (.5 + .36 * Math.sin(t * .33)); ty = H * (.52 + .3 * Math.sin(t * .51 + 1.2)); }
    lx += (tx - lx) * .12; ly += (ty - ly) * .12;
    const R = Math.max(110, Math.min(190, W * .13));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(base, 0, 0);
    ctx.textBaseline = "middle"; ctx.textAlign = "center";

    // Scan waves from a click: every hidden line they cross lights up and fades.
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i], age = Math.max(0, (now - rp.t) / 1000), rr = age * 900;
      if (rr > Math.hypot(W, H) + 100) { ripples.splice(i, 1); continue; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = `rgba(239,59,44,${.5 * (1 - age / 2)})`; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rr, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = `rgba(31,107,255,${.25 * (1 - age / 2)})`; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, Math.max(0, rr - 14), 0, Math.PI * 2); ctx.stroke();
      hiddenLines.forEach((hl, k) => { const d = Math.hypot((hl.c0 + hl.c1) / 2 * cw - rp.x, hl.r * ch - rp.y); if (Math.abs(d - rr) < 40) reveal[k] = 1; });
    }
    ctx.font = FONT_B;
    hiddenLines.forEach((hl, k) => {
      const a = reveal[k] || 0; if (a < .01) return;
      reveal[k] = a * .982;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(239,59,44,${.1 * a})`; ctx.fillRect(hl.c0 * cw - 3, hl.r * ch + 1, (hl.c1 - hl.c0) * cw + 6, ch - 2);
      ctx.fillStyle = `rgba(201,42,28,${a})`;
      for (let c = hl.c0; c < hl.c1 && c < cols; c++) drawChar(grid[hl.r][c], c * cw + cw / 2, hl.r * ch + ch / 2, 1);
    });

    // Quiet the field behind the headline so the words stay on top.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save(); ctx.translate(W / 2, H * .45); ctx.scale(1, .62);
    const vg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.min(W * .5, 760));
    vg.addColorStop(0, "rgba(251,250,248,.86)"); vg.addColorStop(.6, "rgba(251,250,248,.6)"); vg.addColorStop(1, "rgba(251,250,248,0)");
    ctx.fillStyle = vg; ctx.fillRect(-W, -H * 2, W * 2, H * 4); ctx.restore();

    // The lens: a clean disc, everything in it magnified and readable, hidden text in red.
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.fillStyle = "rgba(251,250,248,.94)"; ctx.fill(); ctx.clip();
    const r0 = Math.max(0, Math.floor((ly - R) / ch)), r1 = Math.min(rows - 1, Math.ceil((ly + R) / ch));
    const c0 = Math.max(0, Math.floor((lx - R) / cw)), c1 = Math.min(cols - 1, Math.ceil((lx + R) / cw));
    let found: { x: number; y: number } | null = null;
    for (const pass of [0, 1]) {
      ctx.font = pass ? FONT_B : FONT;
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
        const g = grid[r][c]; if (g.c === " " || (g.hid >= 0) !== !!pass) continue;
        const px = c * cw + cw / 2, py = r * ch + ch / 2, d = Math.hypot(px - lx, py - ly);
        if (d > R) continue;
        const k = 1 - d / R, s = 1 + .32 * k, mx = lx + (px - lx) * s, my = ly + (py - ly) * s;
        if (pass) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = `rgba(239,59,44,${.14 * Math.min(1, k * 3)})`; ctx.fillRect(mx - cw * s / 2, my - ch * s / 2 + 2, cw * s + .5, ch * s - 4);
          ctx.fillStyle = "#c92a1c";
          if (k > .3 && (!found || py < found.y)) found = { x: mx, y: my };
        } else ctx.fillStyle = `rgba(20,18,15,${.25 + .6 * k})`;
        const glyph = k < .14 && Math.random() < .4 ? { c: GLYPHS[(Math.random() * GLYPHS.length) | 0], hid: -1 } : g;
        drawChar(glyph, mx, my, s);
      }
    }
    ctx.restore();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = found ? "rgba(239,59,44,.75)" : "rgba(20,18,15,.22)"; ctx.lineWidth = found ? 2 : 1.2;
    ctx.beginPath(); ctx.arc(lx, ly, R, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + t * .4; ctx.beginPath(); ctx.moveTo(lx + Math.cos(a) * (R + 4), ly + Math.sin(a) * (R + 4)); ctx.lineTo(lx + Math.cos(a) * (R + 14), ly + Math.sin(a) * (R + 14)); ctx.stroke(); }
    tag.classList.toggle("show", !!found);
    if (found) { tag.style.left = clamp(lx + R * .55, 90, W - 90) + "px"; tag.style.top = (ly - R * .85) + "px"; }
  };

  const start = () => { build(); lx = tx = W / 2; ly = ty = H * .5; if (!reduced) requestAnimationFrame(frame); else frame(performance.now()); };
  document.fonts.ready.then(start);
  let rt = 0; addEventListener("resize", () => { clearTimeout(rt); rt = window.setTimeout(build, 150); });
  hero.addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); tx = e.clientX - r.left; ty = e.clientY - r.top; lastMove = performance.now(); });
  hero.addEventListener("click", (e) => { if ((e.target as HTMLElement).closest("a,button")) return; const r = cv.getBoundingClientRect(); ping(e.clientX - r.left, e.clientY - r.top); });
  whileVisible(hero, (v) => { const was = visible; visible = v; if (v && !was && !reduced) requestAnimationFrame(frame); });
  return { ping: () => ping(W / 2, H * .45) };
}

const WORDS = ["force-pushed to main.", "leaked your .env.", "dropped a table.", "obeyed a README.", "turned off its own guard.", "emailed every customer."];

export function introAndHeadline(onDone: () => void) {
  const rot = $("#rot");
  const words = () => {
    if (reduced || still) return;
    const tl = gsap.timeline({ repeat: -1, delay: 1.6 });
    [...WORDS.slice(1), WORDS[0]].forEach((w) => {
      tl.to(rot, { duration: 1, scrambleText: { text: w, chars: "!<>-_\\/[]{}=+*^?#", speed: .7, revealDelay: .25 }, ease: "none",
        })
        .to({}, { duration: 1.6 });
    });
  };
  const headline = () => {
    if (reduced || still) { onDone(); words(); return; }
    const split = SplitText.create("#h1-a", { type: "words,chars", mask: "words" });
    const tl = gsap.timeline({ onComplete: () => { onDone(); } });
    // Once the letters are up, the masks have done their job: unwrap them so nothing is clipped.
    tl.call(() => split.revert(), [], 1.6);
    tl.from(split.chars, { yPercent: 120, rotate: 10, duration: 1.1, ease: "expo.out", stagger: .018 }, .05)
      .from(".l2", { opacity: 0, scale: .6, filter: "blur(18px)", duration: 1, ease: "expo.out" }, .45)
      .from(["#sub", "#acts", "#works"], { y: 30, opacity: 0, duration: .9, ease: "expo.out", stagger: .09 }, .65)
      .from(".scroll-cue", { opacity: 0, duration: .6 }, 1.2);
    words();
  };

  if (reduced || still) { document.documentElement.classList.add("no-intro"); headline(); return; }
  const tl = gsap.timeline();
  tl.to("#intro-bar", { scaleX: 1, duration: .9, ease: "power2.inOut" })
    .from("#intro-t", { duration: .9, scrambleText: { text: "WithHuman", chars: "01<>/#", speed: .9 } }, 0)
    .to("#intro", { yPercent: -100, duration: .85, ease: "expo.inOut" }, "+=.1")
    .add(headline, "-=.45")
    .set("#intro", { display: "none" });
}

export function heroScrollOut() {
  if (reduced || still) return;
  gsap.to("#hero-in", { yPercent: -22, scale: .93, opacity: 0, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
  gsap.to("#field", { yPercent: 18, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
}
