export type ReleaseValidationInput = {
  version: string;
  packageVersion: string | null;
  versionFile: string | null;
  lockfileVersion: string | null;
  changelog: string;
  branch?: string | null;
  currentSha?: string | null;
  originMainSha?: string | null;
  tagSha?: string | null;
  historical?: boolean;
};

export type HistoricalRelease = {
  version: string;
  commit: string;
  title: string;
  retrospective: true;
};

export const HISTORICAL_RELEASES: readonly HistoricalRelease[] = Object.freeze([
  {
    version: "0.1.0",
    commit: "fed4a41fa606d2c20f045c49872c4a4a384ba341",
    title: "UADS v0.1.0 - Foundation",
    retrospective: true,
  },
  {
    version: "0.2.0",
    commit: "8a920a22f28e7317883776bb397060deaf5306d8",
    title: "UADS v0.2.0 - Orchestrator Kernel",
    retrospective: true,
  },
  {
    version: "0.3.0",
    commit: "ccd24218c1ffa2693f9e3d2d5dfe797738961ac0",
    title: "UADS v0.3.0 - Bounded Execution Engine",
    retrospective: true,
  },
  {
    version: "0.4.0",
    commit: "de0842435890517c02f5c1171cacd1fec3e845d7",
    title: "UADS v0.4.0 - Context Intelligence",
    retrospective: true,
  },
  {
    version: "0.5.0",
    commit: "9b1012c11c135c2eaa8b191d0526e796a0c6bcda",
    title: "UADS v0.5.0 - Fault Localization & Failure Memory",
    retrospective: true,
  },
  {
    version: "0.6.0",
    commit: "9433ca04d3db41411d313959f140a707459bae74",
    title: "UADS v0.6.0 - Evidence Cache & Cost Governor",
    retrospective: true,
  },
]);

const SEMVER_RE = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|[0-9A-Za-z-]*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

export function isValidSemVer(version: string): boolean {
  return SEMVER_RE.test(version.trim());
}

export function releaseTag(version: string): string {
  return `v${version}`;
}

export function validateReleaseMetadata(input: ReleaseValidationInput): string[] {
  const errors: string[] = [];
  const version = input.version.trim();

  if (!isValidSemVer(version)) {
    errors.push("invalid-semver");
  }
  if (input.packageVersion !== version) {
    errors.push("package-version-mismatch");
  }
  if (input.versionFile?.trim() !== version) {
    errors.push("VERSION-mismatch");
  }
  if (input.lockfileVersion !== version) {
    errors.push("lockfile-version-mismatch");
  }
  if (!new RegExp(`^## \\[${escapeRegExp(version)}\\]`, "m").test(input.changelog)) {
    errors.push("changelog-version-missing");
  }
  if (!input.historical && input.branch !== "main") {
    errors.push("release-branch-must-be-main");
  }
  if (!input.historical && input.currentSha && input.originMainSha && input.currentSha !== input.originMainSha) {
    errors.push("current-commit-not-on-origin-main");
  }
  if (input.tagSha && input.currentSha && input.tagSha !== input.currentSha) {
    errors.push("release-tag-conflict");
  }
  return errors;
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
