import { afterEach } from "vitest";
import { cleanupReactRoots } from "@siheom/react";
import { configure } from "@testing-library/dom";
import "./styles.css";

declare global {
  // React 19 browser tests need an explicit act environment flag.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// siheom의 찾기·기다리기는 Testing Library의 waitFor를 쓴다. 기본 1초는 전체 테스트를 함께
// 돌릴 때 lazy 모듈(카메라 등)을 처음 불러오는 시간보다 짧다.
configure({ asyncUtilTimeout: 3000 });

afterEach(async () => {
  await cleanupReactRoots();
});
