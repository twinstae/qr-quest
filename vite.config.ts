/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
// import path from "node:path";
// import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";

import { fakeAliases } from "./fake-aliases.ts";
// const dirname =
//   typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// 실제 DB(PGlite)를 쓰는 테스트.
const DB_TESTS = ["src/persistence/drizzle/**/*.test.ts", "src/application/**/*.drizzle.test.ts"];

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
    tanstackStart({
      spa: {
        enabled: true,
      },
    }),
    viteReact(),
  ],
  test: {
    projects: [
      {
        extends: true,
        plugins: [],
        resolve: { alias: fakeAliases },
        test: {
          maxWorkers: 1,
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
          exclude: DB_TESTS,
        },
      },
      {
        extends: true,
        plugins: [],
        test: {
          name: "db",
          environment: "node",
          include: DB_TESTS,
          // PGlite는 하나가 ~500MB라 여러 워커가 각자 띄우면 메모리가 모자라 스왑이 돈다.
          // 한 워커에서 파일을 순서대로 돌리고(isolate: false) PGlite 하나를 같이 쓴다
          // (src/persistence/drizzle/test-helpers.ts).
          fileParallelism: false,
          isolate: false,
          // 워커 수가 다른 프로젝트와는 같이 못 돈다 — 나머지 테스트가 끝난 뒤에 돈다.
          sequence: { groupOrder: 1 },
        },
      },
    ],
  },
});
export default config;
