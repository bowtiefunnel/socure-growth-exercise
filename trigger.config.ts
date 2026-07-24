import { defineConfig } from "@trigger.dev/sdk/v3";
import { additionalFiles, syncEnvVars } from "@trigger.dev/build/extensions/core";
import { readFileSync } from "node:fs";

// push local .env keys to the deployed environment (absent .env → sync nothing)
function envFromDotenv() {
  try {
    return readFileSync(new URL("./.env", import.meta.url), "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return { name: l.slice(0, i).trim(), value: l.slice(i + 1).trim().replace(/^["']|["']$/g, "") };
      })
      .filter((v) => v.name && v.value);
  } catch {
    return [];
  }
}

export default defineConfig({
  project: "proj_mhabzywnykvsnlgymkfg",
  dirs: ["./tools"], // agent-anatomy convention: tools/ IS the task directory
  maxDuration: 600,
  retries: {
    enabledInDev: false,
    default: { maxAttempts: 3, minTimeoutInMs: 1000, maxTimeoutInMs: 10000, factor: 2 },
  },
  build: {
    extensions: [
      // bundle the agent's editable surface + inputs into cloud deploys
      additionalFiles({ files: ["instructions.md", "prompts/**", "config/**", "data/**"] }),
      syncEnvVars(() => envFromDotenv()),
    ],
  },
});
