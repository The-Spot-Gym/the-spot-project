import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ command, mode }) => {
  const plugins: any[] = [react()];

  // Lovable-only dev plugin. Keep builds working even when lovable-tagger (or its deps)
  // aren't present in local environments.
  // Only attempt to load Lovable's dev-only tagger while running the dev server.
  // This prevents local builds (vite build) from ever touching lovable-tagger,
  // which can break in some local dependency setups.
  if (command === "serve" && mode === "development") {
    try {
      const { componentTagger } = await import("lovable-tagger");
      plugins.push(componentTagger());
    } catch {
      // eslint-disable-next-line no-console
      console.warn("[vite] lovable-tagger not available; skipping componentTagger plugin");
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
