import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, join } from "node:path";

const cargoBinDir = join(homedir(), ".cargo", "bin");
const env = { ...process.env };

if (existsSync(cargoBinDir)) {
  const currentPath = env.PATH || "";
  if (!currentPath.split(delimiter).includes(cargoBinDir)) {
    env.PATH = `${cargoBinDir}${delimiter}${currentPath}`;
  }
}

const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
const tauriArgs = ["tauri", "build", ...process.argv.slice(2)];

console.log(`Starting Tauri build with cargo PATH set...`);
const child = spawn(npxCmd, tauriArgs, {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});

child.on("exit", (code, signal) => {
  if (code !== 0) {
    process.exit(code ?? 1);
  }
  console.log("Tauri build completed successfully.");
});
