import { readFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";

import { createFixture, executeRuntime } from "../../tests/lib/full-skin-runtime-fixture.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const RUNTIME_PATH = path.join(ROOT, "packages", "full-skin", "runtime.js");

export const DEFAULT_RUNTIME_BUDGET = Object.freeze({
  maxEnsureCalls: 0,
  maxEnsureDurationMs: 50,
  maxCallbackWallMs: 2000,
  maxCpuMs: 1500,
  maxHeapGrowthBytes: 32 * 1024 * 1024,
  maxEventLoopDelayMs: 100,
});

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function runFullSkinRuntimeBenchmark({ iterations = 10000 } = {}) {
  if (!Number.isSafeInteger(iterations) || iterations < 1 || iterations > 100000) {
    throw new Error("Benchmark iterations must be an integer from 1 through 100000");
  }

  const runtime = await readFile(RUNTIME_PATH, "utf8");
  const fixture = createFixture();
  await executeRuntime(runtime, fixture, "long-session");
  const state = fixture.context.__ACT_FULL_SKIN_STATE__;
  const baseline = { ...state.metrics };
  const cpuBefore = process.cpuUsage();
  const heapBefore = process.memoryUsage().heapUsed;
  const callbackStartedAt = performance.now();

  for (let index = 0; index < iterations; index += 1) fixture.emitOutputMutation();

  const callbackWallMs = performance.now() - callbackStartedAt;
  const cpu = process.cpuUsage(cpuBefore);
  const responsivenessStartedAt = performance.now();
  await new Promise((resolve) => setImmediate(resolve));
  const eventLoopDelayMs = performance.now() - responsivenessStartedAt;
  await wait(240);

  return {
    fixture: "full-skin-long-session-v1",
    iterations,
    observerCallbacks: state.metrics.mutationCallbacks - baseline.mutationCallbacks,
    ignoredMutationCallbacks: state.metrics.ignoredMutationCallbacks - baseline.ignoredMutationCallbacks,
    relevantMutationCallbacks: state.metrics.relevantMutationCallbacks - baseline.relevantMutationCallbacks,
    ensureCalls: state.metrics.ensureCalls - baseline.ensureCalls,
    ensureDurationMs: state.metrics.ensureDurationMs - baseline.ensureDurationMs,
    callbackWallMs,
    cpuMs: (cpu.user + cpu.system) / 1000,
    heapGrowthBytes: process.memoryUsage().heapUsed - heapBefore,
    eventLoopDelayMs,
  };
}

export function assertRuntimeBudget(result, budget = DEFAULT_RUNTIME_BUDGET) {
  const violations = [];
  if (result.ensureCalls > budget.maxEnsureCalls) violations.push(`ensureCalls ${result.ensureCalls}`);
  if (result.ensureDurationMs > budget.maxEnsureDurationMs) violations.push(`ensureDurationMs ${result.ensureDurationMs}`);
  if (result.callbackWallMs > budget.maxCallbackWallMs) violations.push(`callbackWallMs ${result.callbackWallMs}`);
  if (result.cpuMs > budget.maxCpuMs) violations.push(`cpuMs ${result.cpuMs}`);
  if (result.heapGrowthBytes > budget.maxHeapGrowthBytes) violations.push(`heapGrowthBytes ${result.heapGrowthBytes}`);
  if (result.eventLoopDelayMs > budget.maxEventLoopDelayMs) violations.push(`eventLoopDelayMs ${result.eventLoopDelayMs}`);
  if (result.observerCallbacks !== result.iterations) {
    violations.push(`observerCallbacks ${result.observerCallbacks}`);
  }
  if (result.ignoredMutationCallbacks !== result.iterations || result.relevantMutationCallbacks !== 0) {
    violations.push("unrelated output must not trigger runtime reconciliation");
  }
  if (violations.length) throw new Error(`Full Skin runtime budget exceeded: ${violations.join(", ")}`);
}
