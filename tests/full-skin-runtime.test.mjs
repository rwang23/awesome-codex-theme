import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createFixture, executeRuntime } from "./lib/full-skin-runtime-fixture.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const RUNTIME = await readFile(path.join(ROOT, "packages", "full-skin", "runtime.js"), "utf8");

function wait(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

test("Full Skin uses a Blob-backed document background instead of a removable image node", async function () {
  const fixture = createFixture();
  const result = await executeRuntime(RUNTIME, fixture, "route-stable");
  const state = fixture.context.__ACT_FULL_SKIN_STATE__;

  assert.equal(result.pass, true);
  assert.equal(result.version, "act-full-skin-v1");
  assert.equal(result.implementationVersion, "act-full-skin-runtime-v3");
  assert.equal(fixture.document.getElementById("act-full-skin-art"), null);
  assert.match(fixture.document.documentElement.style.getPropertyValue("--act-art-image"), /^url\("blob:act-runtime-1"\)$/);
  assert.equal(state.artwork.loaded, true);
  assert.equal(state.artwork.width, 2560);
  assert.equal(state.artwork.height, 1440);
  assert.equal(fixture.intervals.size, 1);
  assert.equal(state.observer.target, fixture.document.body);
  assert.deepEqual(state.observer.options, { childList: true, subtree: true });
});

test("Full Skin ignores unrelated output mutations and reconciles a changed route once", async function () {
  const fixture = createFixture();
  await executeRuntime(RUNTIME, fixture, "coalesced");
  const state = fixture.context.__ACT_FULL_SKIN_STATE__;
  const initialEnsures = state.metrics.ensureCalls;

  for (let index = 0; index < 200; index += 1) fixture.emitOutputMutation();
  await wait(260);

  assert.equal(state.metrics.mutationCallbacks, 200);
  assert.equal(state.metrics.ignoredMutationCallbacks, 200);
  assert.equal(state.metrics.scheduledReconciles, 0);
  assert.equal(state.metrics.ensureCalls, initialEnsures);

  fixture.setHome(false);
  fixture.emitRouteMutation();
  await wait(260);

  assert.equal(state.metrics.relevantMutationCallbacks, 1);
  assert.equal(state.metrics.scheduledReconciles, 1);
  assert.equal(state.metrics.ensureCalls, initialEnsures + 1);
  assert.equal(fixture.document.documentElement.classList.contains("act-full-skin-home"), false);
  assert.equal(fixture.document.documentElement.classList.contains("act-full-skin-task"), true);
});

test("Full Skin repairs a missing runtime marker, main target replacement, repeated navigation, and cleanup", async function () {
  const fixture = createFixture();
  await executeRuntime(RUNTIME, fixture, "repairable");
  const state = fixture.context.__ACT_FULL_SKIN_STATE__;
  const initialEnsures = state.metrics.ensureCalls;

  fixture.document.documentElement.classList.remove("act-full-skin");
  fixture.runIntervals();
  assert.equal(state.metrics.fallbackHealthChecks, 1);
  assert.equal(state.metrics.ensureCalls, initialEnsures + 1);
  assert.equal(fixture.document.documentElement.classList.contains("act-full-skin"), true);

  fixture.replaceMain(false);
  await wait(260);
  assert.equal(fixture.document.documentElement.classList.contains("act-full-skin-task"), true);

  const previousObserver = state.observer;
  fixture.replaceBody(true);
  fixture.runIntervals();
  assert.equal(state.observer.target, fixture.document.body);
  assert.equal(previousObserver.disconnected, true);
  assert.equal(fixture.document.documentElement.classList.contains("act-full-skin-home"), true);

  for (const home of [true, false, true]) {
    fixture.setHome(home);
    fixture.emitRouteMutation();
    await wait(260);
    assert.equal(fixture.document.documentElement.classList.contains("act-full-skin-home"), home);
  }

  assert.equal(state.cleanup(), true);
  assert.equal(fixture.intervals.size, 0);
  assert.equal(state.observer.disconnected, true);
  assert.equal(fixture.document.getElementById("act-full-skin-style"), null);
  assert.equal(fixture.document.getElementById("act-full-skin-caption"), null);
});

test("A retired runtime cannot clean up a newer theme", async function () {
  const fixture = createFixture();
  await executeRuntime(RUNTIME, fixture, "first");
  const first = fixture.context.__ACT_FULL_SKIN_STATE__;
  await executeRuntime(RUNTIME, fixture, "second");
  const second = fixture.context.__ACT_FULL_SKIN_STATE__;

  assert.notEqual(first, second);
  assert.equal(first.cleanup(), false);
  assert.equal(fixture.context.__ACT_FULL_SKIN_STATE__.themeId, "second");
  assert.equal(fixture.document.documentElement.classList.contains("act-full-skin"), true);
  assert.deepEqual(fixture.revoked, ["blob:act-runtime-1"]);
});
