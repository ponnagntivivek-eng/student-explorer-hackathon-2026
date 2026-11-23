#!/usr/bin/env node
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { constants as osConstants } from "node:os";
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const viteJs = join(root, "node_modules", "vite", "bin", "vite.js");
function loadAppEnv() {
  try {
    const raw = JSON.parse(readFileSync(join(root, ".grok", "app-env.json"), "utf8"));
    const out = {};
    for (const [k, v] of Object.entries(raw || {})) {
      if (k.startsWith("VITE_") && typeof v === "string" && process.env[k] === undefined) out[k] = v;
    }
    return out;
  } catch { return {}; }
}
if (!existsSync(viteJs)) {
  console.error("Vite is not installed. Run: npm install && npm run dev");
  process.exit(1);
}
const args = process.argv.slice(2);
const child = spawn(process.execPath, [viteJs, ...args], { stdio: "inherit", cwd: root, env: { ...process.env, ...loadAppEnv() } });
for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) process.on(signal, () => { try { child.kill(signal); } catch {} });
child.on("error", (err) => { console.error("Failed to start Vite:", err.message); process.exit(1); });
child.on("exit", (code, signal) => {
  if (signal) { const s = osConstants.signals[signal]; process.exit(128 + (typeof s === "number" ? s : 1)); }
  process.exit(code ?? 1);
});
