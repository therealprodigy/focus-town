import { existsSync } from "node:fs";
import { spawnSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
process.chdir(root);
if (Number(process.versions.node.split(".")[0]) < 24) {
  console.error(
    "Focus Town needs Node.js 24 or newer: https://nodejs.org/en/download",
  );
  process.exit(1);
}
if (!existsSync("node_modules/vite/bin/vite.js")) {
  console.log("First visit: installing Focus Town dependencies...");
  const setup = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["ci"],
    { stdio: "inherit", shell: process.platform === "win32" },
  );
  if (setup.error || setup.status !== 0) {
    console.error(
      "Setup stopped. Check the message above and try npm start again.",
    );
    process.exit(1);
  }
}
console.log(
  "Opening Focus Town. Keep this terminal open; press Ctrl+C to stop.",
);
const game = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "--host",
    "127.0.0.1",
    "--port",
    "5173",
    "--strictPort",
    "--open",
  ],
  { stdio: "inherit" },
);
game.on("error", (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
game.on("exit", (code) => {
  process.exitCode = code ?? 0;
});
process.on("SIGINT", () => game.kill("SIGINT"));
process.on("SIGTERM", () => game.kill("SIGTERM"));
