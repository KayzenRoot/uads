#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const version = process.argv[2];
const artifactDir = valueOf("--artifacts");
const repo = valueOf("--repo") ?? "KayzenRoot/uads";
if (!version || !artifactDir) fail("usage: node scripts/release/publish-release.mjs X.Y.Z --artifacts directory");
const tag = `v${version}`;
const head = git(["rev-parse", "HEAD"]);
const localTagSha = localTag(tag);
const tagSha = remoteTagSha(tag) ?? localTagSha;
if (tagSha && tagSha !== head) fail(`RELEASE_TAG_CONFLICT ${tag}: ${tagSha}`);
if (git(["status", "--porcelain"]).length > 0) fail("release requires a clean worktree");
if (!tagSha) {
  run("git", ["tag", "-a", tag, head, "-m", `UADS ${tag} release`]);
  run("git", ["push", "origin", `refs/tags/${tag}`]);
} else if (!remoteTagSha(tag)) {
  run("git", ["push", "origin", `refs/tags/${tag}`]);
}
const assets = fs.readdirSync(path.resolve(artifactDir)).filter((name) => /\.(tgz|json|txt)$/.test(name)).sort();
if (assets.length < 5) fail("release artifact directory is incomplete");
const existing = spawnSync("gh", ["release", "view", tag, "--repo", repo], { cwd: root, windowsHide: true }).status === 0;
if (!existing) {
  const notes = releaseNotes(version);
  run("gh", ["release", "create", tag, "--repo", repo, "--title", `UADS ${tag} - GitHub Release Engineering`, "--notes", notes, "--prerelease", "--verify-tag", ...assets.map((asset) => path.join(artifactDir, asset))]);
}
process.stdout.write(`published ${tag} at ${head}\n`);

function valueOf(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
function git(args) { return run("git", args); }
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) fail(result.stderr || `${command} ${args.join(" ")} failed`);
  return result.stdout.trim();
}
function remoteTagSha(tag) {
  const result = spawnSync("git", ["ls-remote", "origin", `refs/tags/${tag}`, `refs/tags/${tag}^{}`], { cwd: root, encoding: "utf8", windowsHide: true });
  const lines = result.stdout.trim().split(/\r?\n/).filter(Boolean);
  const peeled = lines.find((line) => line.endsWith(`refs/tags/${tag}^{}`));
  return (peeled ?? lines[0])?.split(/\s+/)[0] ?? null;
}
function localTag(tag) {
  const result = spawnSync("git", ["rev-parse", `${tag}^{commit}`], { cwd: root, encoding: "utf8", windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : null;
}
function releaseNotes(version) {
  const changelog = fs.readFileSync(path.join(root, "CHANGELOG.md"), "utf8");
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = changelog.match(new RegExp(`^## \\[${escaped}\\].*?(?=^## \\[|$)`, "ms"));
  return `${match?.[0]?.trim() ?? `UADS ${version}`}\n\nRelease artifacts were produced by the validated release workflow.`;
}
function fail(message) { process.stderr.write(`${message}\n`); process.exit(1); }
