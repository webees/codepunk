import { chmod, copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pin from "./pi.pin.json";

// Pin both version and digests so builds are reproducible and tamper-evident.
const { version: VERSION, licenseSha256: LICENSE_SHA256, platforms: PLATFORMS } = pin;
const ROOT = join(import.meta.dir, "..");
const CACHE = join(ROOT, "node_modules", ".cache", "pi", VERSION);
const BINARIES = join(ROOT, "src-tauri", "binaries");
const RESOURCES = join(ROOT, "src-tauri", "resources", "pi");
const RELEASE = `https://github.com/earendil-works/pi/releases/download/v${VERSION}`;

type Platform = keyof typeof PLATFORMS;

const host = (): string => {
  const arch = process.arch === "arm64" ? "aarch64" : "x86_64";
  if (process.platform === "darwin") return `${arch}-apple-darwin`;
  if (process.platform === "win32") return `${arch}-pc-windows-msvc`;
  if (process.platform === "linux") return `${arch}-unknown-linux-gnu`;
  throw new Error(`Unsupported host platform: ${process.platform}`);
};

const sha256 = (data: string | ArrayBuffer): string =>
  new Bun.CryptoHasher("sha256").update(data).digest("hex");

const run = (command: string, args: string[]): void => {
  const result = Bun.spawnSync([command, ...args], { stdout: "inherit", stderr: "inherit" });
  if (result.exitCode !== 0) throw new Error(`${command} exited with code ${result.exitCode}`);
};

const download = async (url: string, name: string, expected: string): Promise<string> => {
  const path = join(CACHE, name);
  const cached = Bun.file(path);
  if ((await cached.exists()) && sha256(await cached.arrayBuffer()) === expected) return path;

  const response = await fetch(url, { redirect: "follow" });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  const data = await response.arrayBuffer();
  const actual = sha256(data);
  if (actual !== expected) throw new Error(`Checksum mismatch for ${name}: ${actual}`);
  await Bun.write(path, data);
  return path;
};

type Package = { temporary: string; root: string; target: Platform };

const extract = async (target: Platform): Promise<Package> => {
  const { asset, sha256: checksum } = PLATFORMS[target];
  const source = await download(`${RELEASE}/${asset}`, asset, checksum);
  const temporary = await mkdtemp(join(tmpdir(), "codepunk-pi-"));
  run("tar", ["-xf", source, "-C", temporary]);
  const nested = join(temporary, "pi");
  const root = (await Bun.file(join(nested, "package.json")).exists()) ? nested : temporary;
  return { temporary, root, target };
};

const target = process.argv[2] ?? process.env.TAURI_ENV_TARGET_TRIPLE ?? host();
const targets =
  target === "universal-apple-darwin"
    ? (["aarch64-apple-darwin", "x86_64-apple-darwin"] as const)
    : ([target] as Platform[]);

const unsupported = targets.find((platform) => !(platform in PLATFORMS));
if (unsupported) throw new Error(`Unsupported target: ${unsupported}`);

await Promise.all([
  mkdir(CACHE, { recursive: true }),
  mkdir(BINARIES, { recursive: true }),
  mkdir(RESOURCES, { recursive: true }),
]);

const packages: Package[] = [];
try {
  for (const platform of targets) packages.push(await extract(platform));

  const [first] = packages;
  if (!first) throw new Error("Pi archive did not contain a package directory");

  for (const archive of packages) {
    const extension = archive.target.includes("windows") ? ".exe" : "";
    const output = join(BINARIES, `pi-${archive.target}${extension}`);
    await copyFile(join(archive.root, `pi${extension}`), output);
    if (!extension) await chmod(output, 0o755);
  }

  if (targets.length > 1) {
    const output = join(BINARIES, `pi-${target}`);
    run("lipo", [
      "-create",
      ...packages.map((archive) => join(archive.root, "pi")),
      "-output",
      output,
    ]);
  }

  const license = await download(
    `https://raw.githubusercontent.com/earendil-works/pi/v${VERSION}/LICENSE`,
    "LICENSE",
    LICENSE_SHA256,
  );
  await Promise.all([
    copyFile(join(first.root, "package.json"), join(RESOURCES, "package.json")),
    copyFile(join(first.root, "photon_rs_bg.wasm"), join(RESOURCES, "photon_rs_bg.wasm")),
    copyFile(license, join(RESOURCES, "LICENSE")),
  ]);
  console.log(`Pi ${VERSION} prepared for ${target}`);
} finally {
  await Promise.all(
    packages.map((archive) => rm(archive.temporary, { recursive: true, force: true })),
  );
}
