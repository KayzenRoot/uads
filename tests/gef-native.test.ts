import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { validateAgainstSchema } from "../src/lib/json-schema.js";
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

type FixturePackageManager = "npm" | "pnpm" | "yarn" | "bun" | "unknown";
const FIXTURE_SECRET = "GEF_FIXTURE_SECRET_SHOULD_NOT_LEAK_7d3f";

function makeProject(manager: FixturePackageManager = "npm"): string {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-project-"));
  git(repo, ["init", "-b", "main"]);
  git(repo, ["config", "user.email", "gef-tests@example.invalid"]);
  git(repo, ["config", "user.name", "GEF tests"]);
  git(repo, ["remote", "add", "origin", "https://github.com/example/gef-fixture.git"]);
  fs.writeFileSync(path.join(repo, "package.json"), JSON.stringify({
    name: "gef-fixture",
    scripts: { build: "tsc", test: "vitest", lint: "tsc --noEmit", "eval:smoke": "node smoke.js" },
  }, null, 2));
  const lockFiles: Record<Exclude<FixturePackageManager, "unknown">, string> = {
    npm: "package-lock.json",
    pnpm: "pnpm-lock.yaml",
    yarn: "yarn.lock",
    bun: "bun.lock",
  };
  if (manager !== "unknown") fs.writeFileSync(path.join(repo, lockFiles[manager]), "fixture-lock\n");
  fs.mkdirSync(path.join(repo, ".github", "workflows"), { recursive: true });
  fs.writeFileSync(path.join(repo, ".github", "workflows", "ci.yml"), "name: CI\n");
  fs.writeFileSync(path.join(repo, "README.md"), "fixture\n");
  fs.writeFileSync(path.join(repo, ".env"), `GEF_TOKEN=${FIXTURE_SECRET}\n`);
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

  it.each([
    ["npm", "npm run build"],
    ["pnpm", "pnpm run build"],
    ["yarn", "yarn run build"],
    ["bun", "bun run build"],
  ] as const)("uses the bounded %s package runner", (manager, expected) => {
    const repo = makeProject(manager);
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-home-"));
    const result = adoptGefProject({ cwd: repo, uadsHome: home });
    expect(result.profile.packageManager).toBe(manager);
    expect(result.profile.commands.build).toBe(expected);
    expect(validateAgainstSchema("gef-project-profile.schema.json", result.profile)).toEqual([]);
  });

  it("does not invent commands when the package manager is unknown", () => {
    const repo = makeProject("unknown");
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-home-"));
    const result = adoptGefProject({ cwd: repo, uadsHome: home });
    expect(result.profile.packageManager).toBe("unknown");
    expect(result.profile.commands).toEqual({ build: null, test: null, typecheck: null, lint: null });
    expect(validateAgainstSchema("gef-project-profile.schema.json", result.profile)).toEqual([]);
    const invalidRunner = { ...result.profile, commands: { ...result.profile.commands, build: "deno run build" } };
    expect(validateAgainstSchema("gef-project-profile.schema.json", invalidRunner)).not.toEqual([]);
  });

  it("covers every W0 CLI surface end-to-end with global-only and fail-closed proofs", () => {
    const repo = makeProject("npm");
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-cli-home-"));
    const cli = path.resolve("dist", "cli.js");
    expect(fs.existsSync(cli)).toBe(true);
    const run = (...args: string[]) => spawnSync(process.execPath, [cli, ...args], {
      cwd: repo,
      encoding: "utf8",
      env: { ...process.env, UADS_HOME: home },
    });
    const before = fs.readdirSync(home);

    const status = run("gef", "status", "--json");
    expect(status.status, status.stderr).toBe(0);
    const statusJson = JSON.parse(status.stdout) as { registered: boolean; sourceStatus: string };
    expect(statusJson).toMatchObject({ registered: false, sourceStatus: "UNREGISTERED" });
    expect(fs.readdirSync(home)).toEqual(before);

    const adopted = run("gef", "adopt", "--json");
    expect(adopted.status, adopted.stderr).toBe(0);
    const adoptedJson = JSON.parse(adopted.stdout) as { projectId: string; adoptionMode: string; authoritativeSkippingEnabled: boolean };
    expect(adoptedJson).toMatchObject({ adoptionMode: "PROMPT_ONLY", authoritativeSkippingEnabled: false });
    expect(fs.existsSync(path.join(repo, ".uads"))).toBe(false);
    expect(fs.readdirSync(home)).toEqual(["gef"]);

    const profileShow = run("gef", "profile", "show", "--json");
    expect(profileShow.status, profileShow.stderr).toBe(0);
    const profilePayload = JSON.parse(profileShow.stdout) as { profile: Record<string, unknown>; adoptionGap: Record<string, unknown> };
    expect(validateAgainstSchema("gef-project-profile.schema.json", profilePayload.profile)).toEqual([]);
    expect(validateAgainstSchema("gef-adoption-gap.schema.json", profilePayload.adoptionGap)).toEqual([]);
    expect(profileShow.stdout).not.toContain(repo);
    expect(profileShow.stdout).not.toMatch(/[A-Za-z]:\\/);
    expect(profileShow.stdout).not.toContain(FIXTURE_SECRET);

    const healthyDoctor = run("gef", "doctor", "--json");
    expect(healthyDoctor.status, healthyDoctor.stderr).toBe(0);
    expect(JSON.parse(healthyDoctor.stdout).checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "profile", status: "PASS" }),
      expect.objectContaining({ name: "current", status: "PASS" }),
      expect.objectContaining({ name: "authoritative-skipping", status: "PASS" }),
    ]));

    const shadowHome = fs.mkdtempSync(path.join(os.tmpdir(), "uads-gef-cli-shadow-"));
    const shadow = spawnSync(process.execPath, [cli, "gef", "adopt", "--shadow", "--json"], {
      cwd: repo,
      encoding: "utf8",
      env: { ...process.env, UADS_HOME: shadowHome },
    });
    expect(shadow.status, shadow.stderr).toBe(0);
    expect(JSON.parse(shadow.stdout)).toMatchObject({ adoptionMode: "SHADOW_PLANNED", authoritativeSkippingEnabled: false });

    const profilePath = getGefProjectPaths(adoptedJson.projectId, home).profile;
    const tampered = JSON.parse(fs.readFileSync(profilePath, "utf8")) as Record<string, unknown>;
    tampered.profileDigest = "0".repeat(64);
    fs.writeFileSync(profilePath, `${JSON.stringify(tampered)}\n`);
    const doctor = run("gef", "doctor", "--json");
    expect(doctor.status, doctor.stderr).toBe(0);
    const doctorJson = JSON.parse(doctor.stdout) as { checks: Array<{ name: string; status: string }> };
    expect(doctorJson.checks).toEqual(expect.arrayContaining([
      expect.objectContaining({ name: "profile", status: "FAIL" }),
      expect.objectContaining({ name: "current", status: "FAIL" }),
      expect.objectContaining({ name: "authoritative-skipping", status: "PASS" }),
    ]));
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
