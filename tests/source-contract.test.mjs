import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { assertGeneratedArtifacts } from "../scripts/ensure-generated.mjs";
import {
  CODEX_THEME_PREFIX,
  parseCodexNativeTheme,
} from "../scripts/lib/codex-native-theme.mjs";
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
});

test("CI invokes the complete source and generated test contract", async function () {
  const [desktopWorkflow, pagesWorkflow] = await Promise.all([
    readFile(path.join(ROOT, ".github", "workflows", "desktop.yml"), "utf8"),
    readFile(path.join(ROOT, ".github", "workflows", "pages.yml"), "utf8"),
  ]);

  assert.match(desktopWorkflow, /run: npm run test:ci/);
  assert.match(pagesWorkflow, /run: npm run test:ci && npm run build/);
});
