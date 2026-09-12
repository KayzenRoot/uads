import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import {
  adoptGefProject,
  readGefAdoptionGap,
  readGefCurrent,
  readGefDoctor,
  readGefProfile,
  readGefStatus,
} from "../src/gef/registry.js";
import { getGefProjectPaths } from "../src/gef/paths.js";
import { readGefSourceSnapshot } from "../src/gef/source.js";

function git(cwd: string, args: string[]): string {
  return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
}

function makeProject(): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-project-"));
  git(repo, ["init", "-b", "main"]);
  git(repo, ["config", "user.email", "gef-tests@example.invalid"]);
  git(repo, ["config", "user.name", "GEF tests"]);
  git(repo, ["remote", "add", "origin", "https://github.com/example/gef-fixture.git"]);
  fs.writeFileSync(path.join(repo, "package.json"), JSON.stringify({
    name: "gef-fixture",
    scripts: { build: "tsc", test: "vitest", lint: "tsc --noEmit", "eval:smoke": "node smoke.js" },
  }, null, 2));
  fs.writeFileSync(path.join(repo, "package-lock.json"), "{}\n");
  fs.mkdirSync(path.join(repo, ".github", "workflows"), { recursive: true });
  fs.writeFileSync(path.join(repo, ".github", "workflows", "ci.yml"), "name: CI\n");
  fs.writeFileSync(path.join(repo, "README.md"), "fixture\n");
  git(repo, ["add", "."]);
  git(repo, ["commit", "-m", "fixture"]);
  return repo;
}

describe("GEF V1 W0 native project registry", () => {
  it("keeps the project identity stable across path relocation", () => {
    const first = makeProject();
    const second = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-relocated-")), "copy");
    fs.cpSync(first, second, { recursive: true });

    const a = readGefSourceSnapshot(first);
    const b = readGefSourceSnapshot(second);
    expect(b.identity.projectId).toBe(a.identity.projectId);
    expect(b.identity.fingerprint).toBe(a.identity.fingerprint);
    expect(b.identity.repositoryGeneration).toBe(a.identity.repositoryGeneration);
    expect(b.repoRoot).not.toBe(a.repoRoot);
  });

  it("does not mutate global state during read-only status", () => {
    const repo = makeProject();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-home-"));
    const before = fs.readdirSync(home);
    const status = readGefStatus({ cwd: repo, uadsHome: home });
    expect(status.registered).toBe(false);
    expect(status.classification).toBe("PARTIALLY_GOVERNED");
    expect(status.sourceStatus).toBe("UNREGISTERED");
    expect(fs.readdirSync(home)).toEqual(before);
  });

  it("adopts globally with closed, path-safe records and an explicit gap matrix", () => {
    const repo = makeProject();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-home-"));
    const result = adoptGefProject({ cwd: repo, uadsHome: home });
    const paths = getGefProjectPaths(result.profile.projectId, home);

    expect(result.profile.fingerprintSource).toBe("remote");
    expect(result.profile.repositoryIdentity).toBe("https://github.com/example/gef-fixture");
    expect(result.profile.commands).toEqual({ build: "npm run build", test: "npm run test", typecheck: null, lint: "npm run lint" });
    expect(result.profile.evalFamilies).toEqual(["smoke"]);
    expect(result.adoptionGap.components).toHaveLength(27);
    expect(result.adoptionGap.components.filter((item) => item.status === "IMPLEMENTED")).toHaveLength(1);
    expect(result.adoptionGap.authoritativeSkippingEnabled).toBe(false);
    expect(JSON.stringify(result.profile)).not.toContain(repo);
    expect(JSON.stringify(result.profile)).not.toContain("repoRoot");
    expect(fs.existsSync(paths.profile)).toBe(true);
    expect(readGefProfile(result.profile.projectId, home)?.profileDigest).toBe(result.profile.profileDigest);
    expect(readGefCurrent(result.profile.projectId, home)?.currentDigest).toBe(result.current.currentDigest);
    expect(readGefAdoptionGap(result.profile.projectId, home)?.gapDigest).toBe(result.adoptionGap.gapDigest);
  });

  it("records Shadow Assurance as planned without enabling skipping", () => {
    const repo = makeProject();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-home-"));
    const result = adoptGefProject({ cwd: repo, uadsHome: home, shadow: true });
    expect(result.profile.adoptionMode).toBe("SHADOW_PLANNED");
    expect(result.adoptionGap.authoritativeSkippingEnabled).toBe(false);
  });

  it("reports a moved head and fails closed on a corrupt registry record", () => {
    const repo = makeProject();
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-home-"));
    const result = adoptGefProject({ cwd: repo, uadsHome: home });
    fs.writeFileSync(path.join(repo, "next.txt"), "next\n");
    git(repo, ["add", "next.txt"]);
    git(repo, ["commit", "-m", "next"]);
    expect(readGefStatus({ cwd: repo, uadsHome: home }).sourceStatus).toBe("HEAD_MOVED");

    const paths = getGefProjectPaths(result.profile.projectId, home);
    const tampered = JSON.parse(fs.readFileSync(paths.profile, "utf8")) as Record<string, unknown>;
    tampered.profileDigest = "0".repeat(64);
    fs.writeFileSync(paths.profile, `${JSON.stringify(tampered)}\n`);
    expect(readGefStatus({ cwd: repo, uadsHome: home }).sourceStatus).toBe("CORRUPT");
    fs.writeFileSync(paths.profile, "{\"corrupt\":true}\n");
    expect(readGefStatus({ cwd: repo, uadsHome: home }).sourceStatus).toBe("CORRUPT");
    expect(readGefDoctor({ cwd: repo, uadsHome: home }).checks.find((check) => check.name === "authoritative-skipping")?.status).toBe("PASS");
  });
});
