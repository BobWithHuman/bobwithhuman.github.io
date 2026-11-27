import { ICON } from "./icons";

export const $ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T;
export const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = document) => [...r.querySelectorAll(s)] as T[];
export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const q = new URLSearchParams(location.search);
// ?step=… freezes the page for screenshots: no intro, no smooth scroll, everything shown.
export const still = q.has("step") || q.has("still");
export const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
export const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

export const copy = async (text: string, el: HTMLElement) => {
  try { await navigator.clipboard.writeText(text); el.classList.add("done"); setTimeout(() => el.classList.remove("done"), 1400); } catch {}
};

// <x data-ic="name">label</x> gets the icon put in front of its label.
export const hydrateIcons = () => $$("[data-ic]").forEach((el) => {
  const svg = ICON[el.dataset.ic!]; if (svg) el.insertAdjacentHTML("afterbegin", svg);
});

// Run a canvas loop only while its element is on screen.
export const whileVisible = (el: Element, onChange: (v: boolean) => void, margin = "120px") =>
  new IntersectionObserver((es) => onChange(es[0].isIntersecting), { rootMargin: margin }).observe(el);

export const fitCanvas = (cv: HTMLCanvasElement) => {
  const dpr = Math.min(2, devicePixelRatio || 1), r = cv.getBoundingClientRect();
  cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr);
  const ctx = cv.getContext("2d")!; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w: r.width, h: r.height, dpr };
};
