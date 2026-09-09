import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";

export default defineConfig({
  publicDir: false,
  plugins: [{
    name: "hugo-manifest",
    closeBundle() {
      const data = fileURLToPath(new URL("../data", import.meta.url));
      mkdirSync(data, { recursive: true });
      writeFileSync(`${data}/knowledge.json`, readFileSync(fileURLToPath(new URL("../static/knowledge/.vite/manifest.json", import.meta.url))));
    },
  }],
  base: "./",
  build: {
    outDir: fileURLToPath(new URL("../static/knowledge", import.meta.url)),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./src/main.ts", import.meta.url)),
      output: {
        entryFileNames: "app-[hash].js", chunkFileNames: "[name]-[hash].js",
        manualChunks(id) {
          // Keep the large, stable renderer cached across blog UI iterations.
          if (id.includes("/three/build/three.core.js")) return "three-core";
          if (id.includes("/three/")) return "three-renderer";
        },
      },
    },
  },
});
