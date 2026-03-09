import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

/**
 * Strip remotely hosted code references from bundled dependencies.
 * jsPDF embeds a CDN URL for pdfobject that violates Chrome Web Store MV3 policy,
 * even though the code path is never executed by this extension.
 */
function stripRemoteCodeReferences(): Plugin {
  return {
    name: "strip-remote-code-references",
    renderChunk(code) {
      const cleaned = code.replace(
        /https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/pdfobject\/[^"']*/g,
        ""
      );
      if (cleaned !== code) {
        return { code: cleaned, map: null };
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [react(), stripRemoteCodeReferences()],
  base: "",
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
