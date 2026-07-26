import { fileURLToPath } from "node:url";

export {
  generateRepository,
  generatorUsage,
  parseGenerationOptions,
  readVerifiedSourceProvenance,
  REPOSITORY_ROOT,
  runGeneratorCli,
} from "./lib/theme-generator.mjs";

import { generatorUsage, runGeneratorCli } from "./lib/theme-generator.mjs";

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const result = await runGeneratorCli();
    process.exitCode = result.exitCode;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    console.error(generatorUsage());
    process.exitCode = 1;
  }
}
