import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import nextEnv from "@next/env";

const root = process.cwd();
nextEnv.loadEnvConfig(root, false);
const entry = path.join(root, ".next/standalone/server.js");
if (!existsSync(entry)) { console.error("Run npm run build before npm start."); process.exit(1); }
const child = spawn(process.execPath, [entry], {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production", HOSTNAME: process.env.HOSTNAME || "127.0.0.1", PORT: process.env.PORT || "3000", BOOKING_DATA_DIR: process.env.BOOKING_DATA_DIR || path.join(root, ".local"), BOOKING_CONFIG_PATH: process.env.BOOKING_CONFIG_PATH || path.join(root, "config/booking.json") },
});
child.on("error", () => { console.error("Could not start the server."); process.exitCode = 1; });
child.on("exit", code => { process.exitCode = code ?? 1; });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
