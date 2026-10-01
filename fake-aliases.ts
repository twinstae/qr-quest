import { fileURLToPath } from "node:url";

/**
 * 브라우저 테스트·Storybook에서 진짜 대신 연결하는 가짜 구현체.
 * vi.mock 대신 모듈 해석 단계에서 바꿔 끼운다 (lint: vitest/no-restricted-vi-methods).
 */
const fake = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export const fakeAliases = [
  { find: /^@\/lib\/api-client(\.ts)?$/, replacement: fake("./src/lib/api-client.fake.ts") },
  { find: /^@\/lib\/storage-put(\.ts)?$/, replacement: fake("./src/lib/storage-put.fake.ts") },
  // 카메라가 없으므로 QR 인식을 흉내 내는 컴포넌트로 바꾼다.
  {
    find: /^@yudiel\/react-qr-scanner$/,
    replacement: fake("./src/fakes/react-qr-scanner.fake.tsx"),
  },
];
