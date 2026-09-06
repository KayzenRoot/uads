import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertSchema } from "../src/lib/json-schema.js";
import { sha256Hex } from "../src/lib/hash.js";
import { computeHostExecutionReceiptDigest, handoffHostExecution, listHostExecutionReceipts, persistHostExecutionReceipt, readCurrentHostExecutionReceipt, transitionHostExecutionReceipt } from "../src/adapters/host-execution.js";
import { installHostAdapter, uninstallHostAdapter } from "../src/adapters/host-adapter-install.js";
import { prepareHostDispatchBundle } from "../src/adapters/host-dispatch.js";
import { runAdaptersHandoffCommand, runAdaptersReceiptCommand } from "../src/commands/adapters.js";
import { runFinalize, runDispatch } from "../src/kernel/execution.js";
import { readCurrentExecutionRun } from "../src/kernel/execution-persist.js";
import { runPlan } from "../src/kernel/orchestrator.js";
import { resolveProjectContext } from "../src/kernel/project-context.js";
import { assertZpf, seedFrontend } from "./execution-helpers.js";
import { tempDirs } from "./helpers.js";

const ROOT = process.cwd();
type AdapterId = "cursor" | "codex" | "generic-agent-skills";

function hostHome(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "uads-host-exec-test-"));
}

function fixture(adapterId: AdapterId = "generic-agent-skills") {
  const dirs = tempDirs();
  seedFrontend(dirs.repo);
  const planned = runPlan({
    cwd: dirs.repo,
    uadsHome: dirs.home,
    intake: {
      schema: "uads.intake",
      schemaVersion: "0.2.0",
      objective: "Change the primary button color.",
      domainSignals: ["frontend"],
      affectedAreas: ["src"],
      inScope: ["src"],
      acceptanceCriteria: ["the change is verified"],
      classifier: "host-structured",
    },
  });
  const target = hostHome();
  installHostAdapter(adapterId, { hostHome: target, uadsHome: dirs.home, packageRoot: ROOT }, ROOT);
  const dispatched = runDispatch({ cwd: dirs.repo, uadsHome: dirs.home, session: "implementation-session" });
  const context = resolveProjectContext(dirs.repo, dirs.home);
  return { ...dirs, target, planned, dispatched, context, adapterId };
}

function preparedFixture(adapterId: AdapterId = "generic-agent-skills") {
  const value = fixture(adapterId);
  const bundle = prepareHostDispatchBundle({
    adapterId,
    cwd: value.repo,
    uadsHome: value.home,
    hostHome: value.target,
    schemaRoot: ROOT,
  });
  return { ...value, bundle };
}

function rewrite(file: string, patch: (value: Record<string, unknown>) => Record<string, unknown>): void {
  const value = JSON.parse(fs.readFileSync(file, "utf8")) as Record<string, unknown>;
  fs.writeFileSync(file, `${JSON.stringify(patch(value), null, 2)}\n`);
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b)).map(([key, nested]) => [key, stableValue(nested)]));
}

function handoff(value: ReturnType<typeof preparedFixture>) {
  return handoffHostExecution({
    adapterId: value.adapterId,
    cwd: value.repo,
    uadsHome: value.home,
    hostHome: value.target,
    schemaRoot: ROOT,
  });
}

describe("Prompt 012 Host Execution Boundary", { timeout: 180_000 }, () => {
  it("HEB01 accepts a valid current handoff", () => {
    const value = preparedFixture();
    const receipt = handoff(value);
    expect(receipt.state).toBe("ACCEPTED");
    expect(receipt.executionRunId).toBe(value.dispatched.run.executionRunId);
    expect(() => assertSchema("host-execution-receipt.schema.json", receipt, ROOT)).not.toThrow();
  });

  it("HEB02 fails closed for a missing or corrupt bundle", () => {
    const missing = fixture();
    expect(() => handoffHostExecution({ adapterId: missing.adapterId, cwd: missing.repo, uadsHome: missing.home, hostHome: missing.target, schemaRoot: ROOT })).toThrow(/bundle.*missing/i);
    const corrupt = fixture();
    fs.writeFileSync(corrupt.context.paths.currentHostDispatch, "not-json\n");
    expect(() => handoffHostExecution({ adapterId: corrupt.adapterId, cwd: corrupt.repo, uadsHome: corrupt.home, hostHome: corrupt.target, schemaRoot: ROOT })).toThrow(/bundle.*corrupt|invalid/i);
  });

  it("HEB03 rejects a tampered bundle digest", () => {
    const value = preparedFixture();
    rewrite(value.context.paths.currentHostDispatch, (bundle) => ({ ...bundle, workOrderId: "tampered" }));
    expect(() => handoff(value)).toThrow(/digest|invalid|tamper/i);
  });

  it("HEB04 rejects stale current orchestration artifacts", () => {
    const value = preparedFixture();
    const workOrderPath = path.join(value.context.paths.workOrders, `${value.planned.workOrder.workOrderId}.json`);
    rewrite(workOrderPath, (workOrder) => ({ ...workOrder, objective: "stale objective" }));
    expect(() => handoff(value)).toThrow(/stale|mismatch|model|specialist/i);
  });

  it("HEB05 rejects a cross-project bundle replay", () => {
    const value = preparedFixture();
    rewrite(value.context.paths.currentHostDispatch, (bundle) => {
      const changed = { ...bundle, projectId: "a".repeat(16) };
      const { bundleDigest: _ignored, ...withoutDigest } = changed;
      return { ...changed, bundleDigest: sha256Hex(JSON.stringify(stableValue(withoutDigest))) };
    });
    expect(() => handoff(value)).toThrow(/project/i);
  });

  it("HEB06 rejects wrong-adapter and cross-root replay", () => {
    const value = preparedFixture();
    expect(() => handoffHostExecution({ adapterId: "codex", cwd: value.repo, uadsHome: value.home, hostHome: value.target, schemaRoot: ROOT })).toThrow(/adapter/i);
    expect(() => handoffHostExecution({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, hostHome: hostHome(), schemaRoot: ROOT })).toThrow(/ownership|root|supported/i);
  });

  it("HEB07 requires the non-null current execution run identity", () => {
    const value = fixture();
    const bundle = prepareHostDispatchBundle({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, hostHome: value.target, schemaRoot: ROOT });
    expect(bundle.executionRunId).toBe(value.dispatched.run.executionRunId);
    fs.unlinkSync(path.join(value.context.paths.executionRuns, value.dispatched.run.executionRunId, "run.json"));
    expect(() => handoffHostExecution({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, hostHome: value.target, schemaRoot: ROOT })).toThrow(/execution run|current/i);
  });

  it("HEB08 preserves conservative capability fallback and blocks unsupported ownership", () => {
    const value = preparedFixture();
    expect(value.bundle.execution.parallel).toBe(false);
    expect(value.bundle.execution.roleDispatch).toBe("role-cycling");
    expect(() => handoffHostExecution({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, hostHome: hostHome(), schemaRoot: ROOT })).toThrow(/ownership|root|supported/i);
  });

  it("HEB09 makes an authoritative handoff replay read-only", () => {
    const value = preparedFixture();
    const first = handoff(value);
    const second = handoff(value);
    expect(second).toEqual(first);
    expect(listHostExecutionReceipts(value.context.paths, ROOT)).toHaveLength(1);
  });

  it("HEB10 records only allowed deterministic receipt transitions", () => {
    const value = preparedFixture();
    handoff(value);
    const started = transitionHostExecutionReceipt({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, state: "STARTED", schemaRoot: ROOT });
    const completed = transitionHostExecutionReceipt({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, state: "COMPLETED", schemaRoot: ROOT });
    expect(started.state).toBe("STARTED");
    expect(completed.state).toBe("COMPLETED");
    expect(completed.handoffId).toBe(started.handoffId);
    expect(completed.startedAt).not.toBeNull();
    expect(completed.completedAt).not.toBeNull();
  });

  it("HEB11 rejects impossible transitions and terminal rewrites", () => {
    const value = preparedFixture();
    handoff(value);
    expect(() => transitionHostExecutionReceipt({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, state: "COMPLETED", schemaRoot: ROOT })).not.toThrow();
    const terminal = readCurrentHostExecutionReceipt(value.context.paths, ROOT)!;
    expect(() => transitionHostExecutionReceipt({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, state: "STARTED", schemaRoot: ROOT })).toThrow(/immutable|terminal/i);
    expect(readCurrentHostExecutionReceipt(value.context.paths, ROOT)?.receiptDigest).toBe(terminal.receiptDigest);
  });

  it("HEB12 rejects corrupt or tampered receipts", () => {
    const value = preparedFixture();
    handoff(value);
    rewrite(value.context.paths.currentHostExecutionReceipt, (receipt) => ({ ...receipt, state: "COMPLETED" }));
    expect(() => readCurrentHostExecutionReceipt(value.context.paths, ROOT)).toThrow(/digest|corrupt|invalid/i);
    expect(() => transitionHostExecutionReceipt({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, state: "STARTED", schemaRoot: ROOT })).toThrow(/digest|corrupt|invalid/i);
  });

  it("HEB13 persists only in the global sidecar and preserves ZPF", () => {
    const value = preparedFixture();
    const receipt = handoff(value);
    assertZpf(value.repo);
    expect(receipt).toBeDefined();
    expect(value.context.paths.currentHostExecutionReceipt.startsWith(value.home)).toBe(true);
    expect(value.context.paths.currentHostExecutionReceipt.startsWith(value.repo)).toBe(false);
  });

  it("HEB14 rejects extra sensitive or raw operational fields", () => {
    const value = preparedFixture();
    const receipt = handoff(value);
    const invalid = { ...receipt, prompt: "raw prompt", command: "shell command", hostPath: value.target };
    expect(() => assertSchema("host-execution-receipt.schema.json", invalid, ROOT)).toThrow(/additional|must NOT|schema/i);
    expect(JSON.stringify(receipt)).not.toContain(value.target);
    expect(JSON.stringify(receipt)).not.toMatch(/prompt|command|token|credential|private.?key/i);
  });

  it("HEB15 applies one contract to Cursor, Codex, and Generic Agent Skills", () => {
    const value = fixture();
    uninstallHostAdapter("generic-agent-skills", { hostHome: value.target, uadsHome: value.home }, ROOT);
    const receipts = (['cursor', 'codex', 'generic-agent-skills'] as const).map((adapterId) => {
      const target = hostHome();
      installHostAdapter(adapterId, { hostHome: target, uadsHome: value.home, packageRoot: ROOT }, ROOT);
      prepareHostDispatchBundle({ adapterId, cwd: value.repo, uadsHome: value.home, hostHome: target, schemaRoot: ROOT });
      return handoffHostExecution({ adapterId, cwd: value.repo, uadsHome: value.home, hostHome: target, schemaRoot: ROOT });
    });
    expect(receipts.map((receipt) => receipt.schema)).toEqual(["uads.host-execution-receipt", "uads.host-execution-receipt", "uads.host-execution-receipt"]);
    expect(receipts.every((receipt) => receipt.adapterContractVersion === "0.10.0" && receipt.state === "ACCEPTED")).toBe(true);
  });

  it("HEB16 keeps host-managed model provenance conservative", () => {
    const value = preparedFixture();
    const receipt = handoff(value);
    expect(receipt.modelPlanId).toBe(value.bundle.modelPlanId);
    expect(receipt.modelRuntimeIdentityDigest).toBe(value.bundle.modelRuntimeIdentityDigest);
    expect(JSON.stringify(receipt)).not.toMatch(/selectedProviderId|providerId|provider/i);
  });

  it("HEB17 completed receipt cannot satisfy execution gates or finalize", () => {
    const value = preparedFixture();
    handoff(value);
    transitionHostExecutionReceipt({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, state: "STARTED", schemaRoot: ROOT });
    transitionHostExecutionReceipt({ adapterId: value.adapterId, cwd: value.repo, uadsHome: value.home, state: "COMPLETED", schemaRoot: ROOT });
    const runBefore = readCurrentExecutionRun(value.context.paths, ROOT)!;
    expect(runBefore.status).not.toBe("completed");
    expect(runBefore.evidenceRefs).toEqual([]);
    expect(() => runFinalize({ cwd: value.repo, uadsHome: value.home })).toThrow();
    expect(readCurrentExecutionRun(value.context.paths, ROOT)?.evidenceRefs).toEqual([]);
  });

  it("HEB18 keeps bounded receipt history", () => {
    const value = preparedFixture();
    const base = handoff(value);
    const { receiptDigest: _ignoredBaseDigest, ...baseWithoutDigest } = base;
    for (let index = 0; index < 40; index += 1) {
      const createdAt = new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString();
      const candidateBase = {
        ...baseWithoutDigest,
        receiptId: `her_${sha256Hex(`history-${index}`).slice(0, 16)}`,
        createdAt,
        updatedAt: createdAt,
        acceptedAt: createdAt,
      };
      const candidate = { ...candidateBase, receiptDigest: computeHostExecutionReceiptDigest(candidateBase) };
      persistHostExecutionReceipt(value.context.paths, candidate, ROOT);
    }
    expect(listHostExecutionReceipts(value.context.paths, ROOT).length).toBe(32);
  });

  it("HEB19 keeps CLI JSON and human output compact and privacy-safe", () => {
    const value = preparedFixture();
    const json = runAdaptersHandoffCommand({ adapter: value.adapterId, cwd: value.repo, uadsHome: value.home, hostHome: value.target, json: true });
    const parsed = JSON.parse(json) as { state: string; receiptId: string };
    expect(parsed.state).toBe("ACCEPTED");
    expect(json).not.toContain(value.home);
    expect(json).not.toContain(value.target);
    const human = runAdaptersReceiptCommand({ adapter: value.adapterId, cwd: value.repo, uadsHome: value.home, state: "STARTED" });
    expect(human).toContain("state: STARTED");
    expect(human).not.toContain(value.home);
    expect(human).not.toContain(value.target);
  });

  it("HEB20 preserves install, prepare, and uninstall compatibility", () => {
    for (const adapterId of ["cursor", "codex", "generic-agent-skills"] as const) {
      const value = fixture(adapterId);
      const prepared = prepareHostDispatchBundle({ adapterId, cwd: value.repo, uadsHome: value.home, hostHome: value.target, schemaRoot: ROOT });
      expect(prepared.status).toBe("PREPARED");
      const removed = uninstallHostAdapter(adapterId, { hostHome: value.target, uadsHome: value.home }, ROOT);
      expect(removed?.installStatus).toBe("NOT_INSTALLED");
    }
  });
});
