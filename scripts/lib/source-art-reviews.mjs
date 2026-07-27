import { readFile } from "node:fs/promises";
import path from "node:path";

import { isSha256 } from "./release-metadata.mjs";

export const SOURCE_ART_REVIEWS_PATH = "themes/source-art/reviews.json";
const REQUIRED_CHECKS = [
  "noThirdPartyLogo",
  "noSignatureOrWatermark",
  "noUnintendedText",
  "rightsProfileMatches",
  "safeAreaReviewed",
  "lightDarkCaptureReviewed",
];

function fail(message) {
  throw new Error("Source-art review ledger is invalid: " + message);
}

function original(theme) {
  return (theme.rightsProfile || "original") === "original";
}

export function validateSourceArtReviewLedger(catalog, ledger) {
  if (!ledger || typeof ledger !== "object" || Array.isArray(ledger)) fail("root must be an object");
  if (ledger.schemaVersion !== 1) fail("schemaVersion must be 1");
  const review = ledger.review;
  if (!review || typeof review !== "object" || Array.isArray(review)) fail("review must be an object");
  if (typeof review.reviewer !== "string" || review.reviewer.trim().length < 3) fail("reviewer is missing");
  if (typeof review.reviewedAt !== "string" || Number.isNaN(Date.parse(review.reviewedAt))) fail("reviewedAt is invalid");
  if (typeof review.notes !== "string" || review.notes.trim().length === 0) fail("notes are missing");
  if (!review.checks || typeof review.checks !== "object" || Array.isArray(review.checks)) fail("checks must be an object");
  for (const key of REQUIRED_CHECKS) {
    if (review.checks[key] !== true) fail("checks." + key + " must be true");
  }
  if (Object.keys(review.checks).length !== REQUIRED_CHECKS.length) fail("checks must not contain undeclared fields");
  if (!Array.isArray(ledger.attestations)) fail("attestations must be an array");

  const themes = new Map((catalog.themes || []).map((theme) => [theme.id, theme]));
  const records = new Map();
  for (const attestation of ledger.attestations) {
    if (!attestation || typeof attestation !== "object" || Array.isArray(attestation)) fail("attestation must be an object");
    if (Object.keys(attestation).sort().join(",") !== "decision,sourceSha256,themeId") fail("attestation fields are invalid");
    const theme = themes.get(attestation.themeId);
    if (!theme) fail("attestation references an unknown theme " + attestation.themeId);
    if (!original(theme)) fail("fan-art theme " + attestation.themeId + " must not receive original-art approval");
    if (!isSha256(attestation.sourceSha256)) fail(attestation.themeId + " has an invalid source hash");
    if (attestation.decision !== "approved") fail(attestation.themeId + " must have an approved decision");
    if (records.has(attestation.themeId)) fail("duplicate attestation for " + attestation.themeId);
    records.set(attestation.themeId, attestation);
  }
  for (const theme of themes.values()) {
    if (original(theme) !== records.has(theme.id)) {
      fail(original(theme)
        ? "original theme " + theme.id + " is missing an approval"
        : "fan-art theme " + theme.id + " must not receive an approval");
    }
  }
  return { review, records };
}

export async function loadSourceArtReviews(root, catalog) {
  const source = path.join(root, ...SOURCE_ART_REVIEWS_PATH.split("/"));
  const ledger = JSON.parse(await readFile(source, "utf8"));
  return validateSourceArtReviewLedger(catalog, ledger);
}

export function resolveSourceArtReview(theme, sourceProvenance, reviews) {
  if (!original(theme)) {
    if (reviews.records.has(theme.id)) fail("fan-art theme " + theme.id + " must not have an original-art approval");
    return null;
  }
  const attestation = reviews.records.get(theme.id);
  if (!attestation) fail("original theme " + theme.id + " is missing an approval");
  if (attestation.sourceSha256 !== sourceProvenance.sourceSha256) {
    fail("approval source hash does not match provenance for " + theme.id);
  }
  return {
    record: SOURCE_ART_REVIEWS_PATH + "#" + theme.id,
    reviewer: reviews.review.reviewer,
    reviewedAt: reviews.review.reviewedAt,
    checks: reviews.review.checks,
    sourceSha256: attestation.sourceSha256,
    decision: attestation.decision,
    notes: reviews.review.notes,
  };
}
