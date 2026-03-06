import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, "index.html"),
        "service-worker": resolve(__dirname, "src/background/service-worker.ts"),
        analyzer: resolve(__dirname, "src/content/analyzer.ts"),
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
    outDir: "dist",
  },
});
