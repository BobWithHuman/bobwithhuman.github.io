# bobwithhuman.github.io

The WithHuman website, served by GitHub Pages from `main`.

- `index.html` — the landing page, self-contained.
- `demo/index.html` — the session graph, built from `withhuman-viewer/web/record` in English:

```sh
cd withhuman-viewer/web/record
npm run build:en
cp dist-en/index.html ../../../bobwithhuman.github.io/demo/index.html
```
