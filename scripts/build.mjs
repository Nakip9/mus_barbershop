import { spawnSync } from "node:child_process";
import { cpSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const result = spawnSync(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "build", "--webpack"], { cwd: root, stdio: "inherit" });
if (result.error) { console.error("Could not start the Next.js build."); process.exit(1); }
if (result.status !== 0) process.exit(result.status ?? 1);
const output = path.join(root, ".next/standalone");
cpSync(path.join(root, ".next/static"), path.join(output, ".next/static"), { recursive: true });
cpSync(path.join(root, "public"), path.join(output, "public"), { recursive: true });
cpSync(path.join(root, "config"), path.join(output, "config"), { recursive: true });
console.log("Production build ready. Start with npm start.");
