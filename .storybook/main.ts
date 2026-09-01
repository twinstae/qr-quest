import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/tanstack-react";

const apiClientMock = fileURLToPath(new URL("./mocks/api-client.ts", import.meta.url));

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
    config.resolve.alias = {
      ...config.resolve.alias,
      "@/lib/api-client.ts": apiClientMock,
      "@/lib/api-client": apiClientMock,
    };
    return config;
  },
};
export default config;
