import {
  generateRepository,
  parseGenerationOptions,
} from "./lib/theme-generator.mjs";

const DEFAULT_WARM_LIMIT_MS = 60_000;

function usage() {
  return [
    "Usage: node scripts/benchmark-generator.mjs [--scenario=warm|cold|one-theme] [--ids=id[,id]] [--concurrency=1..4] [--max-ms=60000]",
    "",
    "All benchmark scenarios run in --check mode and never write generated files.",
    "warm verifies cache reuse; cold forces rendering; one-theme requires --ids and forces only that theme.",
  ].join("\n");
}

function parseBenchmarkOptions(argv) {
  let scenario = "warm";
  let maxMs = DEFAULT_WARM_LIMIT_MS;
  const generatorArgs = [];

  for (const argument of argv) {
    if (argument === "--help" || argument === "-h") return { help: true };
    if (argument.startsWith("--scenario=")) {
      scenario = argument.slice("--scenario=".length);
      continue;
    }
    if (argument.startsWith("--max-ms=")) {
      maxMs = Number.parseInt(argument.slice("--max-ms=".length), 10);
      continue;
    }
    generatorArgs.push(argument);
  }

  if (!new Set(["warm", "cold", "one-theme"]).has(scenario)) {
    throw new Error("--scenario must be warm, cold, or one-theme");
  }
  if (!Number.isInteger(maxMs) || maxMs < 1) throw new Error("--max-ms must be a positive integer");
  const generator = parseGenerationOptions(["--check", ...generatorArgs]);
  if (generator.help) return { help: true };
  if (generator.force) throw new Error("The benchmark selects force mode from its scenario; omit --force");
  if (scenario === "one-theme" && (!generator.ids || generator.ids.length !== 1)) {
    throw new Error("--scenario=one-theme requires exactly one --ids value");
  }

  return {
    generator: {
      ...generator,
      force: scenario !== "warm",
    },
    maxMs,
    scenario,
  };
}

async function main() {
  const options = parseBenchmarkOptions(process.argv.slice(2));
  if (options.help) {
    console.log(usage());
    return;
  }
  const summary = await generateRepository({ options: options.generator });
  if (summary.drift) throw new Error("Benchmark requires reproducible generated output:\n- " + summary.drift.join("\n- "));

  const result = {
    ...summary,
    budgetMs: options.maxMs,
    scenario: options.scenario,
    withinBudget: summary.elapsedMs <= options.maxMs,
  };
  console.log(JSON.stringify(result));
  if (!result.withinBudget) {
    process.exitCode = 1;
    console.error(
      "Generator benchmark exceeded " + options.maxMs + "ms: " + summary.elapsedMs + "ms (" + options.scenario + ").",
    );
  }
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
