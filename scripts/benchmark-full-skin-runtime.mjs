import {
  assertRuntimeBudget,
  runFullSkinRuntimeBenchmark,
} from "./lib/full-skin-runtime-benchmark.mjs";

const iterations = Number(process.env.ACT_RUNTIME_BENCHMARK_ITERATIONS || 10000);
const result = await runFullSkinRuntimeBenchmark({ iterations });
assertRuntimeBudget(result);
console.log(JSON.stringify(result, null, 2));
