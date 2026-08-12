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
import { readReleaseMetadata, releaseForRegistry } from "../scripts/lib/release-metadata.mjs";
import {
  computeCoverCrop,
  renderFingerprint,
  safeAreaWeight,
  SOURCE_ART_RENDERER_CONSTANTS,
} from "../scripts/lib/source-art-contract.mjs";
import {
  CAPTURE_PRESENTATION_SIZES,
  GALLERY_MEDIA_BUDGET,
  generateCapturePresentations,
  presentationFingerprint,
  presentationPathFor,
} from "../scripts/lib/capture-presentation.mjs";
import {
  isGalleryRequestFailure,
  parseOptions as parseGalleryCheckOptions,
} from "../scripts/verify-gallery.mjs";
import { canUseGlobalActionShortcut } from "../apps/theme-manager/src/renderer/shortcuts.js";
import {
  resolveSourceArtReview,
  validateSourceArtReviewLedger,
} from "../scripts/lib/source-art-reviews.mjs";
import { syncReleaseMetadata } from "../scripts/sync-release-metadata.mjs";
import {
  assessSourceArt,
  parseImageSize,
} from "../scripts/lib/source-art-policy.mjs";
import { decodePng, encodePng, renderSourceArtImage } from "../scripts/lib/png.mjs";
import { contrastRatio, isSafeRelativePath } from "../scripts/validate.mjs";
import {
  assertRuntimeBudget,
  runFullSkinRuntimeBenchmark,
} from "../scripts/lib/full-skin-runtime-benchmark.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("source catalog and image-job provenance stay aligned without generated artifacts", async function () {
  const [catalog, jobs, themeSchema, registrySchema, reviewSchema, reviews] = await Promise.all([
    readFile(path.join(ROOT, "themes", "catalog.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "themes", "source-art", "jobs.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "schemas", "theme-pack.schema.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "schemas", "registry.schema.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "schemas", "source-art-review.schema.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "themes", "source-art", "reviews.json"), "utf8").then(JSON.parse),
  ]);

  assert.equal(catalog.catalogRevision, 2026072701);
  assert.equal(catalog.themes.length, 68);
  assert.equal(catalog.collections.length, 11);
  assert.equal(themeSchema.$schema.includes("2020-12"), true);
  assert.equal(registrySchema.$schema.includes("2020-12"), true);
  assert.equal(reviewSchema.$schema.includes("2020-12"), true);
  assert.deepEqual(
    jobs.jobs.map((job) => job.id).sort(),
    catalog.themes.map((theme) => theme.id).sort(),
  );
  assert.deepEqual(
    jobs.sourceArtPolicy.reviewedUpscaleExceptions.flatMap((exception) => exception.themeIds).sort(),
    catalog.themes.map((theme) => theme.id).sort(),
  );
  assert.deepEqual(jobs.sourceArtPolicy.minimum, {
    width: 2560,
    height: 1440,
    aspectRatio: "16:9",
  });

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
  assert.equal(validateSourceArtReviewLedger(catalog, reviews).records.size, 49);
});

test("source-art approval is explicit, source-hash-bound, and excludes fan art", async function () {
  const [catalog, reviews] = await Promise.all([
    readFile(path.join(ROOT, "themes", "catalog.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "themes", "source-art", "reviews.json"), "utf8").then(JSON.parse),
  ]);
  const parsed = validateSourceArtReviewLedger(catalog, reviews);
  const original = catalog.themes.find((theme) => (theme.rightsProfile || "original") === "original");
  const fanArt = catalog.themes.find((theme) => theme.rightsProfile === "fan-art");
  const provenance = JSON.parse(await readFile(
    path.join(ROOT, "themes", "source-art", original.id + ".provenance.json"),
    "utf8",
  ));
  const review = resolveSourceArtReview(original, provenance, parsed);
  assert.equal(review.decision, "approved");
  assert.equal(review.sourceSha256, provenance.sourceSha256);
  assert.equal(resolveSourceArtReview(fanArt, {}, parsed), null);
  assert.throws(
    () => resolveSourceArtReview(original, { ...provenance, sourceSha256: "0".repeat(64) }, parsed),
    /approval source hash does not match provenance/,
  );
});

test("release metadata is the synchronized source for desktop version and capability disclosure", async function () {
  const metadata = readReleaseMetadata(ROOT);
  const [rootPackage, managerPackage, tauriConfig, catalog, capture, smoke, skinRuntime, readmeText, chineseReadmeText] = await Promise.all([
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "apps", "theme-manager", "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "tauri.conf.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "themes", "catalog.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "scripts", "capture-full-skin-screenshots.mjs"), "utf8"),
    readFile(path.join(ROOT, "scripts", "smoke-theme-manager.mjs"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src-tauri", "src", "skin_runtime.rs"), "utf8"),
    readFile(path.join(ROOT, "README.md"), "utf8"),
    readFile(path.join(ROOT, "README.zh-CN.md"), "utf8"),
  ]);
  assert.equal(rootPackage.version, metadata.desktop.version);
  assert.equal(managerPackage.version, metadata.desktop.version);
  assert.equal(tauriConfig.version, metadata.desktop.version);
  assert.deepEqual(tauriConfig.plugins.updater.endpoints, [metadata.desktop.updater.endpoint]);
  assert.doesNotMatch(tauriConfig.plugins.updater.endpoints[0], /releases\/latest/);
  assert.equal(metadata.desktop.githubPrerelease, true);
  assert.equal(metadata.capabilities.length, 3);
  assert.deepEqual(catalog.defaults, {
    author: "Awesome Codex Theme",
    license: "CC0-1.0",
    codexDesktopTested: metadata.runtime.nativeTestedVersion,
  });
  assert.deepEqual(releaseForRegistry(metadata).capture, {
    channel: metadata.capture.channel,
    appVersion: metadata.capture.appVersion,
    packageFullName: metadata.capture.packageFullName,
    fixture: metadata.capture.fixture,
    modelLabel: metadata.capture.modelLabel,
  });
  assert.match(capture, /readReleaseMetadata/);
  assert.match(smoke, /readReleaseMetadata/);
  assert.doesNotMatch(capture, /const CAPTURE_VERSION = "\d+\.\d+\.\d+"/);
  assert.doesNotMatch(smoke, /const BETA_PACKAGE = "OpenAI\.CodexBeta_/);
  assert.match(skinRuntime, new RegExp(metadata.runtime.implementationVersion));
  for (const currentReadme of [readmeText, chineseReadmeText]) {
    assert.match(currentReadme, /<!-- ACT:CAPABILITY-MATRIX:START -->/);
    assert.match(currentReadme, /<!-- ACT:CAPABILITY-MATRIX:END -->/);
  }
  await assert.doesNotReject(syncReleaseMetadata(["--check"]));
});

test("Gallery and compatibility docs consume generated metadata instead of stale fallback claims", async function () {
  const [index, gallery, adapters, build] = await Promise.all([
    readFile(path.join(ROOT, "site", "index.html"), "utf8"),
    readFile(path.join(ROOT, "site", "assets", "app.js"), "utf8"),
    readFile(path.join(ROOT, "docs", "20-architecture", "adapters.md"), "utf8"),
    readFile(path.join(ROOT, "scripts", "build.mjs"), "utf8"),
  ]);
  assert.match(index, /id="themeStatValue">—/);
  assert.match(index, /id="resultSummary">—/);
  assert.match(index, /id="capabilityMatrix"/);
  assert.match(gallery, /renderCapabilityMatrix/);
  assert.match(gallery, /state\.registry\?\.themes\?\.length/);
  assert.doesNotMatch(gallery, /all 106 theme modes/);
  assert.match(adapters, /Blob URL/);
  assert.match(adapters, /--act-art-image/);
  assert.doesNotMatch(adapters, /assigns that verified image to a manager-created/);
  assert.match(build, /registry\.release\?\.desktop\?\.version/);
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

test("Full Skin semantic-state fixture preserves native semantic colors outside structural surfaces", async function () {
  const [css, fixture] = await Promise.all([
    readFile(path.join(ROOT, "packages", "full-skin", "runtime.css"), "utf8"),
    readFile(path.join(ROOT, "tests", "fixtures", "full-skin-semantic-states.html"), "utf8"),
  ]);

  for (const state of [
    "link",
    "error",
    "warning",
    "success",
    "disabled",
    "focus",
    "selection",
    "diff-added",
    "diff-removed",
  ]) {
    assert.match(fixture, new RegExp(`data-act-semantic-state="${state}"`));
  }

  assert.match(css, /:focus-visible/);
  assert.match(css, /::selection/);
  assert.match(css, /:disabled/);
  assert.match(css, /@media \(forced-colors: active\)/);
  assert.doesNotMatch(css, /\.composer-surface-chrome \*/);
  assert.doesNotMatch(css, /\[class\*="text-token-foreground"\]/);
  assert.doesNotMatch(css, /\[class\*="text-"\]/);
  assert.doesNotMatch(css, /\.composer-surface-chrome svg/);
});

test("Full Skin long-session benchmark records a bounded unrelated-output path", async function () {
  const result = await runFullSkinRuntimeBenchmark({ iterations: 2000 });

  assertRuntimeBudget(result);
  assert.equal(result.observerCallbacks, 2000);
  assert.equal(result.ignoredMutationCallbacks, 2000);
  assert.equal(result.relevantMutationCallbacks, 0);
  assert.equal(result.ensureCalls, 0);
  assert.ok(result.ensureDurationMs >= 0);
  assert.ok(result.cpuMs >= 0);
  assert.ok(Number.isFinite(result.heapGrowthBytes));
  assert.ok(result.eventLoopDelayMs >= 0);
});

test("public and desktop capture labels derive current verification from runtime evidence", async function () {
  const [gallery, manager, managerHtml, validator] = await Promise.all([
    readFile(path.join(ROOT, "site", "assets", "app.js"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "app.js"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "index.html"), "utf8"),
    readFile(path.join(ROOT, "scripts", "validate.mjs"), "utf8"),
  ]);

  assert.match(gallery, /function captureEvidenceIsVerified/);
  assert.match(gallery, /capabilityRuntimePending/);
  assert.match(gallery, /referenceVisualKind/);
  assert.match(manager, /function captureEvidenceIsVerified/);
  assert.match(manager, /referenceCaptureProof/);
  assert.match(managerHtml, /id="captureBadgeLabel"/);
  assert.match(managerHtml, /id="captureProofLabel"/);
  assert.doesNotMatch(managerHtml, /data-i18n="verifiedCapture"/);
  assert.match(validator, /source-tested-recapture-required/);
  assert.match(validator, /Registry runtime evidence does not match/);
});

test("capture presentation paths and integrity fingerprints are deterministic", function () {
  const capture = {
    path: "screenshots/codex-beta-26.715.3651.0/fixture-dark.png",
    sha256: "a".repeat(64),
  };
  assert.deepEqual(CAPTURE_PRESENTATION_SIZES, [
    { width: 320, height: 180 },
    { width: 480, height: 270 },
    { width: 960, height: 540 },
  ]);
  assert.equal(
    presentationPathFor(capture.path, 480),
    "screenshots/codex-beta-26.715.3651.0/presentation/fixture-dark-480.png",
  );
  assert.notEqual(
    presentationFingerprint(capture, CAPTURE_PRESENTATION_SIZES[0]),
    presentationFingerprint(capture, CAPTURE_PRESENTATION_SIZES[1]),
  );
  assert.equal(GALLERY_MEDIA_BUDGET.maxCardBytes, 768 * 1024);
  assert.equal(GALLERY_MEDIA_BUDGET.maxInitialBytes, 3 * 1024 * 1024);
});

test("capture presentation generation detects a missing cached variant", async function () {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "awesome-codex-theme-presentation-"));
  const capturePath = "screenshots/codex-beta-fixture/fixture-light.png";
  const source = encodePng(16, 9, function (x, y) {
    return [x * 16, y * 28, 120, 255];
  });
  const capture = {
    themeId: "fixture",
    mode: "light",
    path: capturePath,
    sha256: createHash("sha256").update(source).digest("hex"),
    bytes: source.length,
    width: 16,
    height: 9,
  };

  try {
    const sourcePath = path.join(temporary, ...capturePath.split("/"));
    await mkdir(path.dirname(sourcePath), { recursive: true });
    await writeFile(sourcePath, source);
    const captureContext = { manifest: { captures: [capture] } };
    const generated = await generateCapturePresentations({ root: temporary, captureContext });
    assert.equal(generated.cacheMisses, 3);
    const variants = generated.index.get("fixture|light");
    assert.equal(variants.length, 3);

    const missingPath = variants[1].path;
    await rm(path.join(temporary, ...missingPath.split("/")));
    const checked = await generateCapturePresentations({ root: temporary, captureContext, check: true });
    assert.deepEqual(checked.drift, [missingPath]);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("package scripts keep source checks fast and generated checks explicit", async function () {
  const [packageJson, desktopPackageJson] = await Promise.all([
    readFile(path.join(ROOT, "package.json"), "utf8").then(JSON.parse),
    readFile(path.join(ROOT, "apps", "theme-manager", "package.json"), "utf8").then(JSON.parse),
  ]);

  assert.equal(packageJson.scripts.test, "npm run test:source");
  assert.match(packageJson.scripts["test:source"], /source-contract\.test\.mjs/);
  assert.match(packageJson.scripts["test:generated"], /ensure-generated\.mjs/);
  assert.equal(packageJson.scripts["runtime:benchmark"], "node scripts/benchmark-full-skin-runtime.mjs");
  assert.match(packageJson.scripts["test:ci"], /^npm run generate/);
  assert.equal(packageJson.scripts["metadata:check"], "node scripts/sync-release-metadata.mjs --check");
  assert.equal(packageJson.scripts["gallery:check"], "node scripts/verify-gallery.mjs");
  assert.equal(packageJson.scripts["art:review"], "node scripts/review-source-art.mjs --check");
  assert.match(packageJson.scripts["test:ci"], /npm run art:review/);
  assert.match(packageJson.scripts["check:full"], /npm run test:ci/);
  assert.match(desktopPackageJson.scripts.check, /^node \.\.\/\.\.\/scripts\/prepare-desktop\.mjs && cargo fmt/);
});

test("gallery check accepts both standard screenshot argument forms", function () {
  assert.equal(
    parseGalleryCheckOptions(["--screenshot=gallery-home.png"]).screenshot,
    "gallery-home.png",
  );
  assert.equal(
    parseGalleryCheckOptions(["--screenshot", "gallery-home.png"]).screenshot,
    "gallery-home.png",
  );
  assert.throws(
    () => parseGalleryCheckOptions(["--screenshot"]),
    /--screenshot requires a relative output path/,
  );
});

test("gallery browser check ignores Chromium's undeclared favicon fallback", function () {
  const siteUrl = "http://127.0.0.1:4173/";
  assert.equal(
    isGalleryRequestFailure({
      method: "Network.responseReceived",
      params: {
        type: "Other",
        response: { status: 404, url: siteUrl + "favicon.ico" },
      },
    }, siteUrl),
    false,
  );
  assert.equal(
    isGalleryRequestFailure({
      method: "Network.responseReceived",
      params: {
        type: "Fetch",
        response: { status: 404, url: siteUrl + "themes/registry.json" },
      },
    }, siteUrl),
    true,
  );
});

test("gallery browser check retries isolated profile cleanup after Chromium exits", async function () {
  const galleryCheck = await readFile(path.join(ROOT, "scripts", "verify-gallery.mjs"), "utf8");
  assert.match(galleryCheck, /maxRetries:\s*PROFILE_REMOVE_RETRIES/);
  assert.match(galleryCheck, /retryDelay:\s*PROFILE_REMOVE_RETRY_DELAY_MS/);
  assert.match(galleryCheck, /child\.signalCode !== null/);
  assert.match(galleryCheck, /text:\s*"\\r"/);
  assert.match(galleryCheck, /unmodifiedText:\s*"\\r"/);
});

test("Theme Manager uses native dialog semantics and simple button selectors", async function () {
  const [html, app, styles, packageJson] = await Promise.all([
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "index.html"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "app.js"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "src", "renderer", "styles.css"), "utf8"),
    readFile(path.join(ROOT, "apps", "theme-manager", "package.json"), "utf8").then(JSON.parse),
  ]);

  assert.match(html, /<dialog\s+class="consent-dialog"\s+id="persistenceConsentDialog"/);
  assert.doesNotMatch(html, /role="tablist"|role="listbox"/);
  assert.doesNotMatch(
    html,
    /id="persistenceConsentDialog"[^>]*role="dialog"|role="dialog"[^>]*id="persistenceConsentDialog"/,
  );
  assert.match(app, /persistenceConsentDialog\.showModal\(\)/);
  assert.match(app, /persistenceConsentDialog\.addEventListener\("cancel"/);
  assert.match(app, /setFallbackBackgroundInert/);
  assert.match(app, /trapFallbackConsentFocus/);
  assert.doesNotMatch(app, /button\.role\s*=\s*"tab"|button\.role\s*=\s*"option"/);
  assert.match(app, /button\.setAttribute\("aria-pressed"/);
  assert.doesNotMatch(app, /key\s*===\s*"c"/);
  assert.match(styles, /dialog\.consent-dialog::backdrop/);
  assert.match(styles, /\.consent-fallback-backdrop/);
  assert.match(styles, /@media \(forced-colors: active\)/);
  assert.match(styles, /\.action-card > p \{[^}]*font-size: 11px/s);
  assert.match(styles, /\.persistence-copy small \{[^}]*font-size: 11px/s);
  assert.equal(packageJson.scripts["a11y:check"], "node scripts/verify-a11y.mjs");
  assert.equal(packageJson.devDependencies["axe-core"], "4.12.1");
});

test("Theme Manager global action shortcut leaves selection and controls alone", function () {
  const neutralTarget = { closest: () => null };
  const editableTarget = { closest: () => ({}) };
  const contentEditableTarget = { isContentEditable: true, closest: () => null };
  const selectedText = { isCollapsed: false, toString: () => "selected diagnostic" };
  const selectedWhitespace = { isCollapsed: false, toString: () => " " };
  const emptySelection = { isCollapsed: true, toString: () => "" };

  assert.equal(canUseGlobalActionShortcut({ dialogOpen: false, selection: emptySelection, target: neutralTarget }), true);
  assert.equal(canUseGlobalActionShortcut({ dialogOpen: true, selection: emptySelection, target: neutralTarget }), false);
  assert.equal(canUseGlobalActionShortcut({ dialogOpen: false, selection: selectedText, target: neutralTarget }), false);
  assert.equal(canUseGlobalActionShortcut({ dialogOpen: false, selection: selectedWhitespace, target: neutralTarget }), false);
  assert.equal(canUseGlobalActionShortcut({ dialogOpen: false, selection: emptySelection, target: editableTarget }), false);
  assert.equal(canUseGlobalActionShortcut({ dialogOpen: false, selection: emptySelection, target: contentEditableTarget }), false);
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
  assert.match(desktopWorkflow, /a11y:\n\s+name: Verify Theme Manager accessibility/);
  assert.match(desktopWorkflow, /run: npm run a11y:check --prefix apps\/theme-manager/);
  assert.match(desktopWorkflow, /ACT_CHROME_BIN: google-chrome/);
  assert.match(desktopWorkflow, /cancel-in-progress: true/);
  assert.match(desktopWorkflow, /- "screenshots\/\*\*"/);
  assert.match(desktopWorkflow, /- "LICENSE"/);
  assert.match(desktopWorkflow, /- "NOTICE\.md"/);
  const triggerSection = desktopWorkflow.slice(0, desktopWorkflow.indexOf("\njobs:"));
  assert.match(triggerSection, /push:\n\s+branches:\n\s+- main\n\s+tags:\n\s+- "v\*"/);
  assert.match(triggerSection, /pull_request:/);
  assert.match(triggerSection, /workflow_dispatch:/);
  const prFastJob = desktopWorkflow.slice(
    desktopWorkflow.indexOf("\n  pr_fast:"),
    desktopWorkflow.indexOf("\n  prepare:"),
  );
  const prepareJob = desktopWorkflow.slice(
    desktopWorkflow.indexOf("\n  prepare:"),
    desktopWorkflow.indexOf("\n  a11y:"),
  );
  const desktopJob = desktopWorkflow.slice(
    desktopWorkflow.indexOf("\n  desktop:"),
    desktopWorkflow.indexOf("\n  pages:"),
  );
  const pagesJob = desktopWorkflow.slice(
    desktopWorkflow.indexOf("\n  pages:"),
    desktopWorkflow.indexOf("\n  deploy:"),
  );
  assert.match(prFastJob, /if: github\.event_name == 'pull_request'/);
  assert.match(prFastJob, /run: npm run metadata:check/);
  assert.match(prFastJob, /run: npm run test:source/);
  assert.doesNotMatch(prFastJob, /npm run generate/);
  assert.doesNotMatch(prFastJob, /npm run validate/);
  assert.doesNotMatch(prFastJob, /npm run test:generated/);
  assert.doesNotMatch(prFastJob, /npm run build/);
  assert.doesNotMatch(prFastJob, /gallery:check/);
  assert.doesNotMatch(prFastJob, /tauri -- build/);
  assert.match(prepareJob, /if: github\.event_name != 'pull_request'/);
  assert.match(desktopJob, /if: github\.event_name != 'pull_request'/);
  assert.match(pagesJob, /if: github\.event_name != 'pull_request'/);
  const releaseJob = desktopWorkflow.slice(desktopWorkflow.indexOf("\n  release:"));
  assert.match(releaseJob, /permissions:\n\s+contents: write/);
  assert.doesNotMatch(desktopJob, /contents: write/);
  assert.doesNotMatch(desktopWorkflow, /cache: npm/);
  assert.match(desktopWorkflow, /package-manager-cache: false/);
  assert.doesNotMatch(desktopWorkflow, /swatinem\/rust-cache/);
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

test("focal cover crops preserve the focal coordinate while clamping to image edges", function () {
  assert.deepEqual(
    computeCoverCrop({
      sourceWidth: 400,
      sourceHeight: 100,
      targetWidth: 100,
      targetHeight: 100,
      focusX: 0,
      focusY: 0.5,
    }),
    { cropX: 0, cropY: 0, cropWidth: 100, cropHeight: 100, focusX: 0, focusY: 0.5 },
  );
  assert.deepEqual(
    computeCoverCrop({
      sourceWidth: 400,
      sourceHeight: 100,
      targetWidth: 100,
      targetHeight: 100,
      focusX: 1,
      focusY: 0.5,
    }),
    { cropX: 300, cropY: 0, cropWidth: 100, cropHeight: 100, focusX: 1, focusY: 0.5 },
  );
  assert.deepEqual(
    computeCoverCrop({
      sourceWidth: 100,
      sourceHeight: 400,
      targetWidth: 100,
      targetHeight: 100,
      focusX: -2,
      focusY: 2,
    }),
    { cropX: 0, cropY: 300, cropWidth: 100, cropHeight: 100, focusX: 0, focusY: 1 },
  );
  assert.throws(
    () => computeCoverCrop({ sourceWidth: 0, sourceHeight: 1, targetWidth: 1, targetHeight: 1 }),
    /positive numbers/,
  );
});

test("directional safe-area grading has distinct left, right, center, and none profiles", function () {
  assert.ok(safeAreaWeight(0.05, "left") > safeAreaWeight(0.95, "left"));
  assert.ok(safeAreaWeight(0.95, "right") > safeAreaWeight(0.05, "right"));
  assert.ok(safeAreaWeight(0.5, "center") > safeAreaWeight(0.05, "center"));
  assert.equal(safeAreaWeight(0.5, "none"), 0);
  assert.throws(() => safeAreaWeight(0.5, "diagonal"), /Unsupported safeArea/);
});

test("focal rendering changes pixels on each crop axis without changing safe-area semantics", function () {
  const pixels = encodePng(40, 40, (x, y) => [x * 6, y * 6, 120, 255]);
  const image = decodePng(pixels);
  const baseTheme = {
    art: { focusX: 0.5, focusY: 0.5, safeArea: "none" },
    light: { tokens: { background: "#FFFFFF" } },
    dark: { tokens: { background: "#101010" } },
  };
  const wide = { ...baseTheme, art: { ...baseTheme.art, focusX: 0.1 } };
  const wideOther = { ...baseTheme, art: { ...baseTheme.art, focusX: 0.9 } };
  const tall = { ...baseTheme, art: { ...baseTheme.art, focusY: 0.1 } };
  const tallOther = { ...baseTheme, art: { ...baseTheme.art, focusY: 0.9 } };

  assert.notDeepEqual(
    renderSourceArtImage(image, wide, "light", 20, 40),
    renderSourceArtImage(image, wideOther, "light", 20, 40),
  );
  assert.notDeepEqual(
    renderSourceArtImage(image, tall, "light", 40, 20),
    renderSourceArtImage(image, tallOther, "light", 40, 20),
  );
});

test("source-art policy accepts canonical sources and only named legacy exceptions", function () {
  const policy = {
    minimum: { width: 2560, height: 1440, aspectRatio: "16:9" },
    reviewedUpscaleExceptions: [{
      id: "legacy-review",
      reviewedAt: "2026-07-26",
      sourceSize: "1536x1024",
      themeIds: ["legacy-theme"],
    }],
  };
  assert.deepEqual(parseImageSize("2560x1440"), { width: 2560, height: 1440 });
  assert.equal(assessSourceArt(policy, "new-theme", { width: 2560, height: 1440 }).kind, "canonical");
  assert.equal(
    assessSourceArt(policy, "legacy-theme", { width: 1536, height: 1024 }).kind,
    "reviewed-upscale-exception",
  );
  assert.equal(assessSourceArt(policy, "new-theme", { width: 1536, height: 1024 }).accepted, false);
  assert.throws(() => parseImageSize("2560:1440"), /WIDTHxHEIGHT/);
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
