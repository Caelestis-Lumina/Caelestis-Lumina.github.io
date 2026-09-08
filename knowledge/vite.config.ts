import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  base: "./",
  build: {
    outDir: fileURLToPath(new URL("../static/knowledge", import.meta.url)),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: {
      input: fileURLToPath(new URL("./src/main.ts", import.meta.url)),
      output: { entryFileNames: "app-[hash].js", chunkFileNames: "[name]-[hash].js" },
    },
  },
});
