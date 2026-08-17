// Runs the frontend (Vite) and the local API server together with a single
// `npm run dev`, so there's no need to start `npm run dev:api` separately.
//
// Zero external dependencies: it just spawns two child processes with the same
// Node binary and forwards their output. Works on Windows, macOS, and Linux.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);

// Resolve Vite's CLI entry point so we can launch it with `node` directly,
// avoiding platform-specific bin shims (vite.cmd on Windows, etc.). We read the
// bin path from Vite's package.json because it isn't exposed as a subpath export.
const vitePkgPath = require.resolve("vite/package.json");
const vitePkg = require("vite/package.json");
const viteBin = join(dirname(vitePkgPath), typeof vitePkg.bin === "string" ? vitePkg.bin : vitePkg.bin.vite);

const targets = [
  {
    name: "api",
    color: "\x1b[36m", // cyan
    args: ["--env-file-if-exists=.env", "server/dev.js"],
  },
  {
    name: "web",
    color: "\x1b[32m", // green
    args: [viteBin],
  },
];

const reset = "\x1b[0m";
const children = [];
let shuttingDown = false;

function prefix(name, color, chunk) {
  const label = `${color}[${name}]${reset} `;
  return chunk
    .toString()
    .split("\n")
    .map((line, i, arr) => (i === arr.length - 1 && line === "" ? line : label + line))
    .join("\n");
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (!child.killed) child.kill("SIGTERM");
  }
  process.exit(code);
}

for (const { name, color, args } of targets) {
  const child = spawn(process.execPath, args, { stdio: ["inherit", "pipe", "pipe"] });
  children.push(child);

  child.stdout.on("data", (d) => process.stdout.write(prefix(name, color, d)));
  child.stderr.on("data", (d) => process.stderr.write(prefix(name, color, d)));

  child.on("exit", (code) => {
    if (!shuttingDown) {
      console.log(`${color}[${name}]${reset} exited with code ${code ?? 0} — stopping the other process.`);
      shutdown(code ?? 0);
    }
  });
}

// Ctrl+C / termination: clean up both children.
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));
