import "./tw.css";
import "lenis/dist/lenis.css";
import "./style.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Flip } from "gsap/Flip";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import Lenis from "lenis";
import { hydrateIcons, q, reduced, still } from "./lib";
import { initBurst, initCursor, initMagnets } from "./fx";
import { heroScrollOut, initField, introAndHeadline } from "./hero";
import { initDemo } from "./demo";
import { initGate } from "./gate";
import { initChrome, initMarquee, initReveals } from "./sections";
import { mountBento } from "./below/Bento";
import { mountMore } from "./below/More";
import { $ } from "./lib";

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin, Flip, DrawSVGPlugin);
if (reduced) document.documentElement.classList.add("reduced");

// Smooth scrolling drives every scroll animation through GSAP's clock.
let lenis: Lenis | null = null;
if (!reduced && !still) {
  // Wheel input is turned into whole-section moves below, so Lenis itself takes none of it.
  lenis = new Lenis({ lerp: .09, smoothWheel: true, wheelMultiplier: q.has("nosnap") ? 1 : 0 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis!.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
if (still) history.scrollRestoration = "manual";
if (q.has("debug")) Object.assign(window, { ScrollTrigger, lenis });

hydrateIcons();
initChrome(lenis);
initCursor();
initMagnets();
initBurst();
const field = initField();
introAndHeadline(() => { if (!still) setTimeout(field.ping, 200); });
heroScrollOut();
initMarquee(lenis);
initDemo();
initGate();
mountBento($("#bento"));
mountMore();
initReveals();
// One wheel gesture moves one whole section. A trackpad keeps sending wheel events for a second or
// more after the fingers lift; those belong to the same gesture, so the next move waits until the
// wheel has been quiet for a moment.
if (lenis && !q.has("nosnap")) {
  const sections = () => [...document.querySelectorAll<HTMLElement>("main > section")];
  const tops = () => sections().map((el) => Math.round(el.getBoundingClientRect().top + lenis!.scroll));
  const QUIET = 220;
  let moving = false, armed = true, last = 0;
  addEventListener("wheel", (e) => {
    if (e.ctrlKey) return;
    e.preventDefault();
    const now = performance.now(), gap = now - last; last = now;
    if (!armed && !moving && gap > QUIET) armed = true;
    if (!armed || Math.abs(e.deltaY) < 3) return;
    const ts = tops(), y = lenis!.scroll;
    let i = 0; ts.forEach((t, k) => { if (Math.abs(t - y) < Math.abs(ts[i] - y)) i = k; });
    const next = Math.max(0, Math.min(ts.length - 1, i + (e.deltaY > 0 ? 1 : -1)));
    armed = false;
    if (next === i) return;
    moving = true;
    lenis!.scrollTo(ts[next], { duration: 1, lock: true, force: true, onComplete: () => { moving = false; } });
  }, { passive: false, capture: true });
}
document.fonts.ready.then(() => ScrollTrigger.refresh());
addEventListener("load", () => ScrollTrigger.refresh());
