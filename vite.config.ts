import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isReplit = !!process.env.REPL_ID;

export default defineConfig(async () => {
  const plugins: any[] = [react()];

  if (isReplit) {
    const { default: runtimeErrorModal } = await import(
      "@replit/vite-plugin-runtime-error-modal"
    );
    plugins.push(runtimeErrorModal());

    if (process.env.NODE_ENV !== "production") {
      const { cartographer } = await import("@replit/vite-plugin-cartographer");
      const { devBanner } = await import("@replit/vite-plugin-dev-banner");
      plugins.push(cartographer(), devBanner());
    }
  }

  return {
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
    server: {
      fs: {
        strict: true,
        deny: ["**/.*"],
      },
    },
  };
});
