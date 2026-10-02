import nextEnv from "@next/env";

export function loadProjectEnv() {
  nextEnv.loadEnvConfig(process.cwd());
}
