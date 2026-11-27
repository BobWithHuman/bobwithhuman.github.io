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
import Snap from "lenis/snap";
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
  lenis = new Lenis({ lerp: .09, smoothWheel: true });
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
// One wheel turn moves one whole section, so nothing is left half on screen.
if (lenis && !q.has("nosnap")) {
  const snap = new Snap(lenis, { type: "lock", duration: 1.1, debounce: 60, distanceThreshold: "100%" });
  document.querySelectorAll<HTMLElement>("main > section").forEach((el) => snap.addElement(el, { align: "start" }));
}
document.fonts.ready.then(() => ScrollTrigger.refresh());
addEventListener("load", () => ScrollTrigger.refresh());
