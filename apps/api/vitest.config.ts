import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Load the repo-root .env for local runs. Real environment variables (CI) always win.
const envFile = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '.env');
const env: Record<string, string> = {};
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && m[1] && !(m[1] in process.env)) env[m[1]] = m[2]?.replace(/^["']|["']$/g, '') ?? '';
  }
}

export default defineConfig({
  test: {
    env,
    projects: [
      { test: { name: 'unit', include: ['test/unit/**/*.test.ts'], env } },
      {
        test: {
          name: 'integration',
          include: ['test/integration/**/*.test.ts'],
          env,
          fileParallelism: false,
          testTimeout: 30_000,
          hookTimeout: 60_000,
        },
      },
    ],
  },
});
