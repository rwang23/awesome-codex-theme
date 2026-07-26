import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { assertGeneratedArtifacts } from "../scripts/ensure-generated.mjs";
import {
  generateRepository,
  parseGenerationOptions,
  readVerifiedSourceProvenance,
} from "../scripts/generate-themes.mjs";
import {
  CODEX_THEME_PREFIX,
  parseCodexNativeTheme,
} from "../scripts/lib/codex-native-theme.mjs";
import {
  renderFingerprint,
  SOURCE_ART_RENDERER_CONSTANTS,
} from "../scripts/lib/source-art-contract.mjs";
import { contrastRatio, isSafeRelativePath } from "../scripts/validate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("source catalog and image-job provenance stay aligned without generated artifacts", async function () {
  const [catalog, jobs, themeSchema, registrySchema] = await Promise.all([
    readFile(path.join(ROOT, "themes", "catalog.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "themes", "source-art", "jobs.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "schemas", "theme-pack.schema.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "schemas", "registry.schema.json"), "utf8").then(JSON.parse),
  ]);

  assert.equal(catalog.catalogRevision, 2026072201);
  assert.equal(catalog.themes.length, 68);
  assert.equal(catalog.collections.length, 11);
  assert.equal(themeSchema.$schema.includes("2020-12"), true);
  assert.equal(registrySchema.$schema.includes("2020-12"), true);
  assert.deepEqual(
    jobs.jobs.map((job) => job.id).sort(),
    catalog.themes.map((theme) => theme.id).sort(),
  );

  for (const theme of catalog.themes) {
    const rightsProfile = theme.rightsProfile || "original";
    assert.equal(["original", "fan-art"].includes(rightsProfile), true);
    assert.equal(typeof theme.name.en, "string");
    assert.equal(typeof theme.name["zh-CN"], "string");
    if (rightsProfile === "fan-art") {
      assert.equal(theme.fanArt.unofficial, true);
      assert.equal(theme.fanArt.commercialUse, false);
      assert.equal(theme.fanArt.officialAssetsUsed, false);
    }
  }
});

test("generated-artifact guard describes the missing prerequisite", async function () {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "awesome-codex-theme-source-test-"));

  try {
    await assert.rejects(
      assertGeneratedArtifacts(temporary),
      /Generated theme artifacts are unavailable: themes\/registry\.json\. Run `npm run generate`/,
    );

    await mkdir(path.join(temporary, "themes"));
    await writeFile(path.join(temporary, "themes", "registry.json"), "{}", "utf8");
    await assert.doesNotReject(assertGeneratedArtifacts(temporary));
  } finally {
    const temporaryRoot = path.resolve(os.tmpdir());
    const resolved = path.resolve(temporary);
    if (resolved.startsWith(temporaryRoot + path.sep)) {
      await rm(resolved, { recursive: true, force: true });
    }
  }
});

test("source-only guards reject unsafe paths and undeclared Native fields", function () {
  assert.equal(isSafeRelativePath("themes/qinglan/manifest.json"), true);
  assert.equal(isSafeRelativePath("../registry.json"), false);
  assert.equal(isSafeRelativePath("themes/../../outside"), false);
  assert.equal(isSafeRelativePath("C:\\outside\\theme.json"), false);
  assert.equal(isSafeRelativePath("/outside/theme.json"), false);
  assert.ok(contrastRatio("#111111", "#FFFFFF") > 15);
  assert.ok(contrastRatio("#777777", "#888888") < 4.5);

  const payload = {
    codeThemeId: "codex",
    theme: {
      accent: "#246A4B",
      contrast: 45,
      fonts: { code: null, ui: null },
      ink: "#15231A",
      opaqueWindows: true,
      semanticColors: {
        diffAdded: "#00A240",
        diffRemoved: "#BA2623",
        skill: "#246A4B",
      },
      surface: "#EDF3EE",
      script: "not allowed",
    },
    variant: "light",
  };

  assert.throws(
    () => parseCodexNativeTheme(CODEX_THEME_PREFIX + JSON.stringify(payload)),
    /fields are invalid/,
  );
});

test("package scripts keep source checks fast and generated checks explicit", async function () {
  const packageJson = JSON.parse(await readFile(path.join(ROOT, "package.json"), "utf8"));

  assert.equal(packageJson.scripts.test, "npm run test:source");
  assert.match(packageJson.scripts["test:source"], /source-contract\.test\.mjs/);
  assert.match(packageJson.scripts["test:generated"], /ensure-generated\.mjs/);
  assert.match(packageJson.scripts["test:ci"], /^npm run generate/);
  assert.match(packageJson.scripts["check:full"], /npm run test:ci/);
  assert.equal(packageJson.scripts["gallery:check"], "node scripts/verify-gallery.mjs");
});

test("CI reuses canonical generated assets with pinned, least-privilege workflows", async function () {
  const [desktopWorkflow, supplyChainWorkflow, dependabot] = await Promise.all([
    readFile(path.join(ROOT, ".github", "workflows", "desktop.yml"), "utf8"),
    readFile(path.join(ROOT, ".github", "workflows", "supply-chain.yml"), "utf8"),
    readFile(path.join(ROOT, ".github", "dependabot.yml"), "utf8"),
  ]);

  assert.match(desktopWorkflow, /run: npm run test:ci/);
  assert.match(desktopWorkflow, /name: act-generated-theme-assets/);
  assert.match(desktopWorkflow, /uses: actions\/download-artifact@[0-9a-f]{40}/);
  assert.match(desktopWorkflow, /run: npm run gallery:check/);
  assert.match(desktopWorkflow, /cancel-in-progress: true/);
  assert.match(desktopWorkflow, /- "screenshots\/\*\*"/);
  assert.match(desktopWorkflow, /- "LICENSE"/);
  assert.match(desktopWorkflow, /- "NOTICE\.md"/);
  const desktopJob = desktopWorkflow.slice(
    desktopWorkflow.indexOf("\n  desktop:"),
    desktopWorkflow.indexOf("\n  pages:"),
  );
  const releaseJob = desktopWorkflow.slice(desktopWorkflow.indexOf("\n  release:"));
  assert.match(releaseJob, /permissions:\n\s+contents: write/);
  assert.doesNotMatch(desktopJob, /contents: write/);
  assert.match(desktopWorkflow, /uses: actions\/checkout@[0-9a-f]{40} # v7/);
  assert.match(supplyChainWorkflow, /reviewdog\/action-actionlint@[0-9a-f]{40}/);
  assert.match(supplyChainWorkflow, /zizmorcore\/zizmor-action@[0-9a-f]{40}/);
  assert.match(dependabot, /package-ecosystem: github-actions/);
  assert.match(dependabot, /package-ecosystem: cargo/);
  for (const workflow of [desktopWorkflow, supplyChainWorkflow]) {
    for (const action of workflow.matchAll(/^\s*uses:\s+[^@\s]+@([^\s#]+)/gm)) {
      assert.match(action[1], /^[0-9a-f]{40}$/);
    }
  }
});

test("incremental generator options stay bounded and explicit", function () {
  assert.deepEqual(
    parseGenerationOptions([
      "--ids=qinglan-odyssey,jiangnan-rain-courtyard",
      "--concurrency=1",
      "--force",
      "--json-progress",
      "--summary",
    ]),
    {
      check: false,
      concurrency: 1,
      force: true,
      help: false,
      ids: ["qinglan-odyssey", "jiangnan-rain-courtyard"],
      jsonProgress: true,
      summary: true,
    },
  );
  assert.throws(() => parseGenerationOptions(["--concurrency=5"]), /from 1 to 4/);
  assert.throws(() => parseGenerationOptions(["--concurrency=1.5"]), /from 1 to 4/);
  assert.throws(() => parseGenerationOptions(["--concurrency=1junk"]), /from 1 to 4/);
  assert.throws(() => parseGenerationOptions(["--ids="]), /at least one theme id/);
});

test("render fingerprints invalidate every declared visual input", function () {
  const theme = {
    art: { focusX: 0.6, focusY: 0.4, safeArea: "left", taskMode: "ambient" },
    light: {
      tokens: {
        background: "#123456",
        surface: "#234567",
        surfaceAlt: "#345678",
        text: "#FFFFFF",
        muted: "#CCCCCC",
        accent: "#AA5500",
        accentContrast: "#FFFFFF",
        border: "#778899",
      },
    },
  };
  const provenance = { sourceSha256: "a".repeat(64) };
  const baseline = renderFingerprint(theme, "light", provenance, 2560, 1440);
  const mutations = [
    (candidate) => { candidate.art.focusX = 0.2; },
    (candidate) => { candidate.art.focusY = 0.8; },
    (candidate) => { candidate.art.safeArea = "right"; },
    (candidate) => { candidate.art.taskMode = "banner"; },
    (candidate) => { candidate.light.tokens.accent = "#0055AA"; },
  ];

  for (const mutate of mutations) {
    const candidate = structuredClone(theme);
    mutate(candidate);
    assert.notEqual(renderFingerprint(candidate, "light", provenance, 2560, 1440), baseline);
  }
  assert.notEqual(renderFingerprint(theme, "light", provenance, 960, 540), baseline);
  assert.ok(Object.keys(SOURCE_ART_RENDERER_CONSTANTS.grading).length > 8);
});

test("generator rejects source art whose bytes no longer match provenance", async function () {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "awesome-codex-theme-source-provenance-"));
  const sourceDirectory = path.join(temporary, "themes", "source-art");
  const source = Buffer.from("verified-source-art", "utf8");
  const sourceSha256 = createHash("sha256").update(source).digest("hex");

  try {
    await mkdir(sourceDirectory, { recursive: true });
    await writeFile(path.join(sourceDirectory, "fixture.png"), source);
    await writeFile(
      path.join(sourceDirectory, "fixture.provenance.json"),
      JSON.stringify({ sourceSha256 }) + "\n",
      "utf8",
    );
    await assert.doesNotReject(readVerifiedSourceProvenance(temporary, "fixture"));

    await writeFile(path.join(sourceDirectory, "fixture.png"), Buffer.from("unexpected-source-art", "utf8"));
    await assert.rejects(
      readVerifiedSourceProvenance(temporary, "fixture"),
      /Source-art hash does not match provenance/,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("targeted generation refuses a mixed legacy Registry migration", async function () {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "awesome-codex-theme-partial-migration-"));
  const themesDirectory = path.join(temporary, "themes");

  try {
    await mkdir(themesDirectory, { recursive: true });
    await writeFile(
      path.join(themesDirectory, "catalog.json"),
      JSON.stringify({ collections: [], themes: [{ id: "fixture" }] }) + "\n",
      "utf8",
    );
    await writeFile(
      path.join(themesDirectory, "registry.json"),
      JSON.stringify({ generatedBy: "act-theme-generator-v4.0", themes: [{ id: "fixture" }] }) + "\n",
      "utf8",
    );
    await assert.rejects(
      generateRepository({ root: temporary, options: { ids: ["fixture"] } }),
      /Partial generation requires a current v5 Registry/,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});
