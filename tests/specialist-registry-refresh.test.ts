import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getUadsPaths } from "../src/lib/workspace.js";
import {
  builtinSpecialistRegistry,
  createSpecialistRegistry,
  loadSpecialistRegistry,
  normalizeSpecialistProfile,
  persistSpecialistRegistry,
} from "../src/kernel/specialist-registry.js";

const ROOT = process.cwd();

describe("built-in specialist registry refresh", () => {
  it("refreshes official built-ins while preserving user-config profiles", () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), "uads-registry-refresh-"));
    const paths = getUadsPaths("project-refresh", home);
    const current = builtinSpecialistRegistry(ROOT);

    const legacyBuiltins = current.profiles
      .filter((profile) => profile.specialistId !== "systems-runtime-specialist")
      .map((profile) => {
        if (profile.specialistId === "test-engineer") {
          return normalizeSpecialistProfile({
            ...profile,
            coveredDomains: profile.coveredDomains.filter((domain) => domain !== "testing"),
            profileDigest: undefined,
          }, "builtin");
        }
        if (profile.specialistId === "independent-reviewer") {
          return normalizeSpecialistProfile({
            ...profile,
            coveredDomains: profile.coveredDomains.filter((domain) => domain !== "certification"),
            profileDigest: undefined,
          }, "builtin");
        }
        return profile;
      });

    const template = current.profiles.find((profile) => profile.specialistId === "frontend-specialist")!;
    const custom = normalizeSpecialistProfile({
      ...template,
      specialistId: "user-custom-frontend",
      source: "user-config",
      profileDigest: undefined,
    }, "user-config");

    const legacy = createSpecialistRegistry([...legacyBuiltins, custom]);
    persistSpecialistRegistry(paths, legacy, ROOT);

    const loaded = loadSpecialistRegistry(paths, ROOT);
    expect(loaded.profiles).toHaveLength(current.profiles.length + 1);
    expect(loaded.profiles.some((profile) => profile.specialistId === "systems-runtime-specialist")).toBe(true);
    expect(
      loaded.profiles.find((profile) => profile.specialistId === "test-engineer")?.coveredDomains,
    ).toContain("testing");
    expect(
      loaded.profiles.find((profile) => profile.specialistId === "independent-reviewer")?.coveredDomains,
    ).toContain("certification");
    expect(loaded.profiles.find((profile) => profile.specialistId === "user-custom-frontend")?.source).toBe("user-config");

    const persisted = JSON.parse(fs.readFileSync(paths.specialistRegistry, "utf8")) as {
      registryDigest: string;
      profiles: Array<{ specialistId: string }>;
    };
    const state = JSON.parse(fs.readFileSync(paths.specialistState, "utf8")) as {
      registryDigest: string;
      profileCount: number;
    };
    expect(persisted.registryDigest).toBe(loaded.registryDigest);
    expect(state.registryDigest).toBe(loaded.registryDigest);
    expect(state.profileCount).toBe(current.profiles.length + 1);
  });
});
