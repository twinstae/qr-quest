/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
// import path from "node:path";
// import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
// const dirname =
//   typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    devtools(),
    nitro({
      rollupConfig: {
        external: [/^@sentry\//],
      },
    }),
    tanstackStart(),
    viteReact(),
  ],
  test: {
    projects: [
      {
        extends: true,
        plugins: [],
        test: {
          setupFiles: ["src/setupTest.ts"],
          name: "browser",
          include: ["src/**/*.test.{ts,tsx}"],
          exclude: ["src/domain/**", "src/application/**", "src/persistence/**", "src/api/**"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
      {
        extends: true,
        plugins: [],
        test: {
          name: "server",
          environment: "node",
          include: [
            "src/domain/**/*.test.ts",
            "src/application/**/*.test.ts",
            "src/persistence/**/*.test.ts",
            "src/api/**/*.test.ts",
          ],
        },
      },
    ],
  },
});
export default config;
