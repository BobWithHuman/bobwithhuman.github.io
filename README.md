# bobwithhuman.github.io

The WithHuman website, served by GitHub Pages from `main`.

- `index.html` — the landing page, built from `site/` (Vite + TypeScript, GSAP, Lenis) into one file:

```sh
cd site && npm install && npm run ship   # builds and copies dist/index.html to ../index.html
```

  `npm run dev` serves it with `demo/`, `docs/` and `assets/` from this folder.
- `demo/index.html` — the session graph, built from `withhuman-viewer/web/record` in English:

```sh
cd withhuman-viewer/web/record
npm run build:en
cp dist-en/index.html ../../../bobwithhuman.github.io/demo/index.html
```
