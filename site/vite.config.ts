import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createReadStream, existsSync, statSync } from "node:fs";
import { extname, join, resolve } from "node:path";

// The page lives at the site root next to demo/, docs/ and assets/; in dev, serve those from the parent folder.
const parent = resolve(import.meta.dirname, "..");
const TYPES: Record<string, string> = { ".png": "image/png", ".svg": "image/svg+xml", ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const siblings = (): Plugin => ({
  name: "siblings",
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const url = (req.url || "").split("?")[0];
      if (!/^\/(assets|demo|docs|favicon\.svg)/.test(url)) return next();
      let file = join(parent, decodeURIComponent(url));
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
      if (!existsSync(file)) return next();
      res.setHeader("Content-Type", TYPES[extname(file)] || "application/octet-stream");
      createReadStream(file).pipe(res);
    });
  },
});

export default defineConfig({
  plugins: [siblings(), react(), tailwindcss(), viteSingleFile()],
  resolve: { alias: { "@": resolve(import.meta.dirname, "src") } },
  build: { target: "es2020", assetsInlineLimit: 100000000 },
});
