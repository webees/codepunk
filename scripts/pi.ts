import { chmod, copyFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

// Pin both version and digests so builds are reproducible and tamper-evident.
const VERSION = "1.5.2";
const ROOT = join(import.meta.dir, "..");
const CACHE = join(ROOT, "node_modules", ".cache", "pi", VERSION);
const BINARIES = join(ROOT, "src-tauri", "binaries");
const RESOURCES = join(ROOT, "src-tauri", "resources", "pi");
const RELEASE = `https://github.com/earendil-works/pi/releases/download/v${VERSION}`;

const PLATFORMS = {
  "aarch64-apple-darwin": [
    "darwin-arm64",
    "tar.gz",
    "56b5e194d485ced555667b8ba3276157a8272e9ecde9e001e428af80985bdd9b",
  ],
  "x86_64-apple-darwin": [
    "darwin-x64",
    "tar.gz",
    "f997a088613514ac97d913aeea7642094d84fe6d46854ff7e64e2c12e536dc50",
  ],
  "aarch64-unknown-linux-gnu": [
    "linux-arm64",
    "tar.gz",
    "42805cd5615952fcbbfc9c56b04f8feb84395134952e169a6cdc8d7676975666",
  ],
  "x86_64-unknown-linux-gnu": [
    "linux-x64",
    "tar.gz",
    "811c6f2c9e7aaee252b5404252e556fb713aa209c1f7f924226aa77d4ef70cb5",
  ],
  "aarch64-pc-windows-msvc": [
    "windows-arm64",
    "zip",
    "e83404bc5a6003ac950683edd9b6cf499dac91ec890d8439a8c32528de534a77",
  ],
  "x86_64-pc-windows-msvc": [
    "windows-x64",
    "zip",
    "e6adb8cb8c84eca14391ad24b363de9d2be98a89ca3ba3fdee1fa4de32b7f2e8",
  ],
} as const;

const LICENSE_SHA256 = "0457f5bcec3b3b211605dfb5d1a49042fd638f3686a410fe099c24a25af13c48";

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
  const [slug, extension, checksum] = PLATFORMS[target];
  const archive = `pi-${slug}.${extension}`;
  const source = await download(`${RELEASE}/${archive}`, archive, checksum);
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

for (const platform of targets) {
  if (!(platform in PLATFORMS)) throw new Error(`Unsupported target: ${platform}`);
}

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
