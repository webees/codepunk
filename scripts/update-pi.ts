import { appendFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const REPO = "earendil-works/pi";
const PIN = join(import.meta.dir, "pi.pin.json");
const TARGETS = {
  "aarch64-apple-darwin": "pi-darwin-arm64.tar.gz",
  "x86_64-apple-darwin": "pi-darwin-x64.tar.gz",
  "aarch64-unknown-linux-gnu": "pi-linux-arm64.tar.gz",
  "x86_64-unknown-linux-gnu": "pi-linux-x64.tar.gz",
  "aarch64-pc-windows-msvc": "pi-windows-arm64.zip",
  "x86_64-pc-windows-msvc": "pi-windows-x64.zip",
} as const;

type Release = {
  tag_name: string;
  assets: { name: string; browser_download_url: string }[];
};

const version = (process.argv[2] || "latest").trim().replace(/^v/, "");
const endpoint = version === "latest" ? "latest" : `tags/v${version}`;
const headers: Record<string, string> = {
  Accept: "application/vnd.github+json",
  "User-Agent": "codepunk-pi-updater",
};
const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
if (token) headers.Authorization = `Bearer ${token}`;

const get = async (url: string): Promise<Response> => {
  const response = await fetch(url, { headers, redirect: "follow" });
  if (!response.ok) throw new Error(`Request failed (${response.status}): ${url}`);
  return response;
};

const release = (await (
  await get(`https://api.github.com/repos/${REPO}/releases/${endpoint}`)
).json()) as Release;
const resolved = release.tag_name.replace(/^v/, "");
const sumsUrl = release.assets.find((asset) => asset.name === "SHA256SUMS")?.browser_download_url;
if (!sumsUrl) throw new Error("Release has no SHA256SUMS asset");

const sums = new Map(
  (await (await get(sumsUrl)).text())
    .trim()
    .split("\n")
    .map((line) => {
      const [sha256, name] = line.trim().split(/\s+/);
      if (!sha256 || !name) throw new Error(`Invalid SHA256SUMS line: ${line}`);
      return [name, sha256] as const;
    }),
);

const license = await (
  await get(`https://raw.githubusercontent.com/${REPO}/v${resolved}/LICENSE`)
).arrayBuffer();
const licenseSha256 = new Bun.CryptoHasher("sha256").update(license).digest("hex");
const platforms = Object.fromEntries(
  Object.entries(TARGETS).map(([target, asset]) => {
    const sha256 = sums.get(asset);
    if (!sha256) throw new Error(`SHA256SUMS is missing ${asset}`);
    return [target, { asset, sha256 }];
  }),
);

await writeFile(
  PIN,
  `${JSON.stringify({ version: resolved, licenseSha256, platforms }, null, 2)}\n`,
);
if (process.env.GITHUB_OUTPUT) {
  await appendFile(process.env.GITHUB_OUTPUT, `version=${resolved}\n`);
}
console.log(`Pi ${resolved} pinned`);
