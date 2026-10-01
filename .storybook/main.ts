import type { StorybookConfig } from "@storybook/tanstack-react";

import { fakeAliases } from "../fake-aliases.ts";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    "@storybook/addon-docs",
    "@storybook/addon-mcp",
  ],
  framework: "@storybook/tanstack-react",
  async viteFinal(config) {
    config.resolve ??= {};
    // 백엔드가 없으므로 테스트와 같은 가짜 구현체를 연결한다.
    const existing = config.resolve.alias ?? [];
    config.resolve.alias = [
      ...fakeAliases,
      ...(Array.isArray(existing)
        ? existing
        : Object.entries(existing).map(([find, replacement]) => ({ find, replacement }))),
    ];
    return config;
  },
};
export default config;
