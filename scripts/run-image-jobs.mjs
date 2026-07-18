import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { homedir, tmpdir } from "node:os";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readPngDimensions } from "./lib/png.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");
const JOBS_PATH = path.join(ROOT, "themes", "source-art", "jobs.json");
const OUTPUT_ROOT = path.join(ROOT, "themes", "source-art");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function option(name) {
  const prefix = "--" + name + "=";
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

function hasFlag(name) {
  return process.argv.includes("--" + name);
}

function locateRunner() {
  if (process.env.OPENAI_IMAGE_JOB_RUNNER) {
    return path.resolve(process.env.OPENAI_IMAGE_JOB_RUNNER);
  }
  return path.join(
    homedir(),
    ".codex",
    "skills",
    "creative-media",
    "openai-image-job",
    "scripts",
    "generate_image_job.py",
  );
}

async function fileExists(target) {
  try {
    return (await stat(target)).isFile();
  } catch {
    return false;
  }
}

function runProcess(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: process.env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
        return;
      }
      reject(new Error(stderr.trim() || stdout.trim() || command + " exited with " + code));
    });
  });
}

async function runJob(job, config, runner, temporaryRoot, force) {
  const output = path.join(OUTPUT_ROOT, job.id + ".png");
  const provenancePath = path.join(OUTPUT_ROOT, job.id + ".provenance.json");
  if (!force && await fileExists(output)) {
    console.log("skip " + job.id + " (source art already exists)");
    return;
  }

  const rightsProfile = job.rightsProfile || "original";
  const commonPrompt = rightsProfile === "fan-art"
    ? config.fanArtPrompt
    : job.promptProfile === "city"
      ? config.cityPrompt
      : config.commonPrompt;
  if (typeof commonPrompt !== "string" || !commonPrompt.trim()) {
    throw new Error(job.id + " is missing a common prompt for " + rightsProfile);
  }
  const prompt = commonPrompt + "\n\nScene brief: " + job.prompt;
  const payload = {
    model: config.workflow.model,
    prompt,
    size: config.workflow.size,
    quality: config.workflow.quality,
    n: 1,
    response_format: config.workflow.responseFormat,
  };
  const payloadPath = path.join(temporaryRoot, job.id + ".request.json");
  const resultPath = path.join(temporaryRoot, job.id + ".result.json");
  await writeFile(payloadPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  console.log("start " + job.id);
  const result = await runProcess("python", [
    runner,
    "--payload",
    payloadPath,
    "--output",
    output,
    "--result-json",
    resultPath,
  ]);

  const image = await readFile(output);
  const dimensions = readPngDimensions(image);
  if (dimensions.width !== 1536 || dimensions.height !== 1024) {
    throw new Error(job.id + " returned " + dimensions.width + "x" + dimensions.height);
  }
  const jobResult = JSON.parse(await readFile(resultPath, "utf8"));
  const fanArt = rightsProfile === "fan-art" ? job.fanArt : undefined;
  const provenance = {
    schemaVersion: 1,
    themeId: job.id,
    rightsProfile,
    workflow: config.workflow.runner,
    model: config.workflow.model,
    size: config.workflow.size,
    quality: config.workflow.quality,
    jobId: jobResult.job_id,
    promptSha256: sha256(Buffer.from(prompt, "utf8")),
    sourceSha256: sha256(image),
    disclosure: rightsProfile === "fan-art"
      ? "AI-generated unofficial fan art. No official image assets were used. Underlying character and franchise rights remain with their respective rights holders."
      : "AI-generated original source art. Prompt and output were reviewed for third-party characters, logos, signatures, and text before release.",
  };
  if (fanArt) provenance.fanArt = fanArt;
  await writeFile(provenancePath, JSON.stringify(provenance, null, 2) + "\n", "utf8");
  console.log("done  " + job.id + " " + result.stdout);
}

async function main() {
  const config = JSON.parse(await readFile(JOBS_PATH, "utf8"));
  const requested = new Set((option("ids") || "").split(",").filter(Boolean));
  const jobs = requested.size
    ? config.jobs.filter((job) => requested.has(job.id))
    : config.jobs;
  const unknown = [...requested].filter((id) => !config.jobs.some((job) => job.id === id));
  if (unknown.length) throw new Error("Unknown theme ids: " + unknown.join(", "));
  if (!jobs.length) throw new Error("No image jobs selected.");

  const runner = locateRunner();
  if (!(await fileExists(runner))) {
    throw new Error(
      "OpenAI image-job runner not found. Set OPENAI_IMAGE_JOB_RUNNER to generate_image_job.py.",
    );
  }
  const concurrency = Math.max(1, Math.min(4, Number.parseInt(option("concurrency") || "2", 10)));
  const force = hasFlag("force");
  const temporaryRoot = await mkdtemp(path.join(tmpdir(), "act-image-jobs-"));
  await mkdir(OUTPUT_ROOT, { recursive: true });

  try {
    let cursor = 0;
    async function worker() {
      while (cursor < jobs.length) {
        const job = jobs[cursor];
        cursor += 1;
        await runJob(job, config, runner, temporaryRoot, force);
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

try {
  await main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
