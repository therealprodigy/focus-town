import { build } from "esbuild";
import { readdir, readFile, mkdir, writeFile, cp } from "node:fs/promises";
import path from "node:path";
const root = process.cwd(),
  out = path.join(root, "dist"),
  assets = {};
const mime = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json",
};
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === "server" || entry.name === ".openai") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else {
      const key = "/" + path.relative(out, full).split(path.sep).join("/");
      assets[key] = {
        type: mime[path.extname(entry.name)] || "application/octet-stream",
        body: (await readFile(full)).toString("base64"),
      };
    }
  }
}
await walk(out);
await build({
  entryPoints: ["server/worker.ts"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  outfile: "dist/server/index.js",
  plugins: [
    {
      name: "assets",
      setup(b) {
        b.onResolve({ filter: /^virtual:focus-town-assets$/ }, () => ({
          path: "assets",
          namespace: "inline",
        }));
        b.onLoad({ filter: /.*/, namespace: "inline" }, () => ({
          contents: "export default " + JSON.stringify(assets),
          loader: "js",
        }));
      },
    },
  ],
});
await mkdir("dist/.openai", { recursive: true });
await cp(".openai/hosting.json", "dist/.openai/hosting.json");
await cp("drizzle", "dist/.openai/drizzle", { recursive: true });
const size = (await readFile("dist/server/index.js")).byteLength;
console.log(
  "Worker built with " +
    Object.keys(assets).length +
    " assets, " +
    Math.round(size / 1024) +
    " KiB.",
);
