import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

const DIR = join(import.meta.dir, "..", "src-tauri", "binaries");
const arch = process.arch === "arm64" ? "aarch64" : "x86_64";
const platforms: Record<string, string> = {
  darwin: "apple-darwin",
  win32: "pc-windows-msvc",
  linux: "unknown-linux-gnu",
};
const platform = platforms[process.platform];
if (!platform) throw new Error(`Unsupported platform: ${process.platform}`);

const suffix = process.platform === "win32" ? ".exe" : "";
const names = process.argv[2]
  ? [`pi-${process.argv[2]}${suffix}`]
  : [`pi-${arch}-${platform}${suffix}`, `pi-universal-apple-darwin${suffix}`];

let file = "";
for (const name of names) {
  const path = join(DIR, name);
  if (await Bun.file(path).exists()) {
    file = path;
    break;
  }
}
if (!file) throw new Error(`Missing ${names.join(" or ")}; run 'bun run pi' first`);

const cwd = await mkdtemp(join(tmpdir(), "codepunk-smoke-"));
const child = Bun.spawn([file, "--mode", "rpc", "--no-session"], {
  cwd,
  stdin: "pipe",
  stdout: "pipe",
  stderr: "inherit",
});

const timeout = setTimeout(() => child.kill(), 30_000);
const decoder = new TextDecoder();
let buffer = "";

const isReply = (line: string): boolean => {
  try {
    const message = JSON.parse(line);
    return message?.command === "get_state" && message.success === true;
  } catch {
    return false;
  }
};

let ready = false;
let exitCode: number | undefined;
try {
  child.stdin.write('{"type":"get_state"}\n');
  await child.stdin.flush();
  const reader = child.stdout.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    if (lines.some(isReply)) {
      ready = true;
      break;
    }
  }
  ready ||= isReply(buffer);
} finally {
  clearTimeout(timeout);
  child.kill();
  exitCode = await child.exited;
  await rm(cwd, { recursive: true, force: true });
}

if (!ready) {
  throw new Error(`Pi sidecar did not answer get_state (exit ${exitCode})`);
}
console.log(`Pi sidecar responded: ${basename(file)}`);
