import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import type Lenis from "lenis";
import { $, $$, esc, fine, reduced, still } from "./lib";
import { ICON } from "./icons";
import { MARQUEE_A, MARQUEE_B } from "./data";

const calm = () => reduced || still;

// Two bands of real-looking injections; they speed up and lean with the scroll.
export function initMarquee(lenis: Lenis | null) {
  const fill = (el: HTMLElement, items: string[]) => { const html = items.map((s) => `<span>${esc(s)}</span>`).join(""); el.innerHTML = html + html; };
  fill($("#mq-a"), MARQUEE_A); fill($("#mq-b"), MARQUEE_B);
  if (calm()) return;
  const rows = $$(".mq-row").map((row) => {
    const track = $(".mq-track", row), dir = +row.dataset.dir!;
    const tw = gsap.fromTo(track, { xPercent: dir < 0 ? 0 : -50 }, { xPercent: dir < 0 ? -50 : 0, duration: 38, ease: "none", repeat: -1 });
    row.addEventListener("pointerenter", () => gsap.to(tw, { timeScale: .15, duration: .5 }));
    row.addEventListener("pointerleave", () => gsap.to(tw, { timeScale: 1, duration: .5 }));
    return { tw, track };
  });
  const skew = gsap.quickTo(rows.map((r) => r.track), "skewX", { duration: .4, ease: "power3" });
  const onVel = (v: number) => {
    rows.forEach((r) => gsap.to(r.tw, { timeScale: 1 + Math.min(6, Math.abs(v) / 4), duration: .3, overwrite: true, onComplete: () => { gsap.to(r.tw, { timeScale: 1, duration: 1.2 }); } }));
    skew(Math.max(-12, Math.min(12, -v / 3)));
  };
  if (lenis) lenis.on("scroll", (l: Lenis) => onVel(l.velocity));
  else ScrollTrigger.create({ onUpdate: (s) => onVel(s.getVelocity() / 200) });
}

// Headings rise line by line; panels come up as they enter.
export function initReveals() {
  if (calm()) { $$(".rv").forEach((el) => gsap.set(el, { opacity: 1, y: 0 })); return; }
  $$(".split").forEach((h) => {
    const s = SplitText.create(h, { type: "lines", linesClass: "line", mask: "lines" });
    gsap.from(s.lines, { yPercent: 110, duration: 1.1, ease: "expo.out", stagger: .1, scrollTrigger: { trigger: h, start: "top 85%" } });
  });
  $$(".kick").forEach((k) => gsap.from(k, { opacity: 0, x: -20, duration: .8, ease: "expo.out", scrollTrigger: { trigger: k, start: "top 90%" } }));
  ScrollTrigger.batch(".rv", { start: "top 88%", onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1, ease: "expo.out", stagger: .1, overwrite: true }) });
}

// One app in the middle, the agents it covers going round it, calls running in along the spokes.
const AGENTS = [
  { id: "claude", name: "Claude Code", logo: "claude", notes: ["every folder", "asks you before a held call"] },
  { id: "codex", name: "Codex CLI", logo: "terminal", notes: ["per project", "held call → blocked"] },
  { id: "cursor", name: "Cursor CLI", logo: "cursor", notes: ["per project", "held call → blocked"] },
  { id: "hermes", name: "Hermes Agent", logo: "feather", notes: ["every session", "held call → blocked"] },
  { id: "openclaw", name: "OpenClaw", logo: "shrimp", notes: ["per device", "asks you before a held call"] },
];
export function initChrome(lenis: Lenis | null) {
  const nav = $("#nav"), bar = $("#progress");
  $("#brand").innerHTML = '<img src="assets/logo.png" alt="WithHuman" />';
  $("#works").innerHTML = AGENTS.map((a) => `<span>${ICON[a.logo]}${a.name}</span>`).join("");
  let lastY = 0;
  const onScroll = (y: number) => {
    nav.classList.toggle("solid", y > 20);
    nav.classList.toggle("away", y > 400 && y > lastY + 2);
    if (y < lastY - 2) nav.classList.remove("away");
    lastY = y;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
  };
  if (lenis) lenis.on("scroll", (l: Lenis) => onScroll(l.scroll)); else addEventListener("scroll", () => onScroll(scrollY), { passive: true });
  $$('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
    const id = a.getAttribute("href")!; const el = id === "#top" ? document.body : $(id); if (!el) return;
    e.preventDefault(); lenis ? lenis.scrollTo(el as HTMLElement, { duration: 1.6, offset: id === "#top" ? 0 : -40 }) : el.scrollIntoView({ behavior: "smooth" });
  }));
}
