import { safeErrorMessage } from "../lib/safe-persist.js";
import {
  adoptGefProject,
  readGefAdoptionGap,
  readGefDoctor,
  readGefProfile,
  readGefStatus,
  summarizeGefDoctor,
  summarizeGefStatus,
} from "../gef/registry.js";

function resolveProject(input: { cwd?: string; project?: string }): string {
  return input.project ?? input.cwd ?? process.cwd();
}

export function runGefStatusCommand(input: { cwd?: string; project?: string; uadsHome?: string; json?: boolean } = {}): string {
  try {
    const status = readGefStatus({ cwd: resolveProject(input), uadsHome: input.uadsHome });
    return input.json ? `${JSON.stringify(status, null, 2)}\n` : summarizeGefStatus(status);
  } catch (error) {
    throw new Error(safeErrorMessage(error));
  }
}

export function runGefAdoptCommand(input: { cwd?: string; project?: string; uadsHome?: string; shadow?: boolean; json?: boolean } = {}): string {
  try {
    const result = adoptGefProject({ cwd: resolveProject(input), uadsHome: input.uadsHome, shadow: input.shadow });
    const payload = {
      status: "ADOPTED",
      classification: result.classification,
      created: result.created,
      projectId: result.profile.projectId,
      fingerprint: result.profile.fingerprint,
      adoptionMode: result.profile.adoptionMode,
      profileDigest: result.profile.profileDigest,
      currentDigest: result.current.currentDigest,
      implementedComponents: result.adoptionGap.components.filter((component) => component.status === "IMPLEMENTED").length,
      stagedComponents: result.adoptionGap.components.filter((component) => component.status === "STAGED").length,
      authoritativeSkippingEnabled: result.adoptionGap.authoritativeSkippingEnabled,
    };
    if (input.json) return `${JSON.stringify(payload, null, 2)}\n`;
    return [
      "GEF adoption",
      `status: ${payload.status}`,
      `classification: ${payload.classification}`,
      `created: ${payload.created}`,
      `projectId: ${payload.projectId}`,
      `fingerprint: ${payload.fingerprint}`,
      `adoptionMode: ${payload.adoptionMode}`,
      `components: ${payload.implementedComponents} implemented, ${payload.stagedComponents} staged`,
      "authoritativeSkippingEnabled: false",
      "",
    ].join("\n");
  } catch (error) {
    throw new Error(safeErrorMessage(error));
  }
}

export function runGefProfileShowCommand(input: { cwd?: string; project?: string; uadsHome?: string; json?: boolean } = {}): string {
  try {
    const status = readGefStatus({ cwd: resolveProject(input), uadsHome: input.uadsHome });
    const profile = readGefProfile(status.projectId, input.uadsHome);
    const gap = readGefAdoptionGap(status.projectId, input.uadsHome);
    if (!profile) throw new Error("GEF project is not registered; run uads gef adopt first");
    const payload = { profile, adoptionGap: gap };
    if (input.json) return `${JSON.stringify(payload, null, 2)}\n`;
    return [
      "GEF profile",
      `projectId: ${profile.projectId}`,
      `projectName: ${profile.projectName}`,
      `fingerprint: ${profile.fingerprint}`,
      `fingerprintSource: ${profile.fingerprintSource}`,
      `repositoryIdentity: ${profile.repositoryIdentity ?? "(none)"}`,
      `repositoryGeneration: ${profile.repositoryGeneration}`,
      `defaultBranch: ${profile.defaultBranch}`,
      `packageManager: ${profile.packageManager}`,
      `adoptionMode: ${profile.adoptionMode}`,
      `profileDigest: ${profile.profileDigest}`,
      `adoptionGap: ${gap ? `${gap.components.filter((component) => component.status === "IMPLEMENTED").length} implemented / ${gap.components.filter((component) => component.status === "STAGED").length} staged` : "(none)"}`,
      "",
    ].join("\n");
  } catch (error) {
    throw new Error(safeErrorMessage(error));
  }
}

export function runGefDoctorCommand(input: { cwd?: string; project?: string; uadsHome?: string; json?: boolean } = {}): string {
  try {
    const result = readGefDoctor({ cwd: resolveProject(input), uadsHome: input.uadsHome });
    return input.json ? `${JSON.stringify(result, null, 2)}\n` : summarizeGefDoctor(result);
  } catch (error) {
    throw new Error(safeErrorMessage(error));
  }
}
