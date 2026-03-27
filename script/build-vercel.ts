import { build as viteBuild } from "vite";
import { build as esbuildBuild } from "esbuild";
import { rm, mkdir, cp, writeFile } from "fs/promises";

async function main() {
  await rm(".vercel/output", { recursive: true, force: true });

  console.log("Building frontend...");
  await viteBuild();

  await mkdir(".vercel/output/static", { recursive: true });
  await mkdir(".vercel/output/functions/api.func", { recursive: true });

  console.log("Copying static files...");
  await cp("dist/public", ".vercel/output/static", { recursive: true });

  console.log("Bundling API function...");
  await esbuildBuild({
    entryPoints: ["api/index.ts"],
    bundle: true,
    platform: "node",
    format: "cjs",
    outfile: ".vercel/output/functions/api.func/index.js",
    external: ["pg-native", "bufferutil", "utf-8-validate"],
    logLevel: "info",
  });

  await writeFile(
    ".vercel/output/functions/api.func/.vc-config.json",
    JSON.stringify(
      {
        runtime: "nodejs20.x",
        handler: "index.js",
        launcherType: "Nodejs",
        maxDuration: 30,
      },
      null,
      2,
    ),
  );

  await writeFile(
    ".vercel/output/config.json",
    JSON.stringify(
      {
        version: 3,
        routes: [
          { src: "^/api(/.*)?$", dest: "/api" },
          { src: "^/connect$", dest: "/api" },
          { src: "^/g(/.*)?$", dest: "/api" },
          { handle: "filesystem" },
          { src: "^/.*$", dest: "/index.html" },
        ],
      },
      null,
      2,
    ),
  );

  console.log("Vercel build complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
