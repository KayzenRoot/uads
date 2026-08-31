#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const repo = valueOf("--repo") ?? "KayzenRoot/uads";
const output = path.resolve(valueOf("--output") ?? path.join(root, "tmp", "github-audit"));
fs.mkdirSync(output, { recursive: true });

const repository = api(`repos/${repo}`);
const mainRef = api(`repos/${repo}/git/ref/heads/main`);
const runs = api(`repos/${repo}/actions/runs?branch=main&per_page=100`);
const ciRuns = (runs.workflow_runs ?? []).filter((run) => run.name === "CI").map((run) => ({
  id: run.id,
  name: run.name,
  headSha: run.head_sha,
  status: run.status,
  conclusion: run.conclusion,
  event: run.event,
  url: run.html_url,
  createdAt: run.created_at,
  updatedAt: run.updated_at,
}));

write("repository.json", pick(repository, ["full_name", "visibility", "default_branch", "description", "homepage", "topics", "has_issues", "has_projects", "has_wiki", "has_discussions", "license", "permissions"]));
write("releases.json", (api(`repos/${repo}/releases?per_page=100`) ?? []).map((release) => ({
  id: release.id,
  tagName: release.tag_name,
  name: release.name,
  draft: release.draft,
  prerelease: release.prerelease,
  targetCommitish: release.target_commitish,
  publishedAt: release.published_at,
  assets: (release.assets ?? []).map((asset) => ({ name: asset.name, size: asset.size, state: asset.state })),
})));
write("tags.json", awaitResolvedTags(repo));
write("workflows.json", (api(`repos/${repo}/actions/workflows?per_page=100`).workflows ?? []).map((workflow) => ({ id: workflow.id, name: workflow.name, path: workflow.path, state: workflow.state })));
write("main-protection.json", optional(`repos/${repo}/branches/main/protection`));
write("main-ruleset.json", optional(`repos/${repo}/rulesets?includes_parents=true`));
write("security-summary.json", {
  securityAndAnalysis: optional(`repos/${repo}/security-and-analysis`),
  automatedSecurityFixes: optional(`repos/${repo}/automated-security-fixes`),
  privateVulnerabilityReporting: optional(`repos/${repo}/private-vulnerability-reporting`),
  limitations: ["GitHub may omit plan-gated security fields from the API response."],
});
write("labels.json", (api(`repos/${repo}/labels?per_page=100`) ?? []).map((label) => ({ name: label.name, color: label.color, description: label.description })));
write("release-v0.7.0.json", optional(`repos/${repo}/releases/tags/v0.7.0`));
write("ci-runs.json", ciRuns);

const headSha = git(["rev-parse", "HEAD"]);
write("summary.json", {
  schema: "uads.github-audit",
  schemaVersion: "0.7.0",
  generatedAt: new Date().toISOString(),
  repository: repo,
  finalCommitSha: headSha,
  mainBranchSha: mainRef.object?.sha ?? null,
  exactHeadCiRuns: ciRuns.filter((run) => run.headSha === (mainRef.object?.sha ?? null)),
  limitations: [
    ...(repository.permissions?.admin === true ? [] : ["BLOCKED_BY_GITHUB_PERMISSION"]),
    "Administrative settings are reported as returned by the authenticated API.",
  ],
});
process.stdout.write(`${JSON.stringify({ output, files: fs.readdirSync(output).sort() }, null, 2)}\n`);

function awaitResolvedTags(targetRepo) {
  const refs = api(`repos/${targetRepo}/git/matching-refs/tags`) ?? [];
  return refs.map((ref) => ({ name: ref.ref.replace(/^refs\/tags\//, ""), object: ref.object }));
}
function api(endpoint) {
  const result = spawnSync("gh", ["api", endpoint], { cwd: root, encoding: "utf8", windowsHide: true });
  if (result.status !== 0) return null;
  try { return JSON.parse(result.stdout); } catch { return null; }
}
function optional(endpoint) {
  const value = api(endpoint);
  return value ?? { status: "unavailable", reason: "github-api-response-unavailable" };
}
function pick(value, keys) {
  if (!value) return { status: "unavailable", reason: "github-api-response-unavailable" };
  return Object.fromEntries(keys.map((key) => [key, value[key] ?? null]));
}
function write(name, value) {
  fs.writeFileSync(path.join(output, name), `${JSON.stringify(value, null, 2)}\n`);
}
function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true });
  return result.status === 0 ? result.stdout.trim() : null;
}
function valueOf(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}
