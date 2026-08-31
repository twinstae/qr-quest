import { afterEach } from "vitest";
import { cleanupReactRoots } from "@siheom/react";
import "./styles.css";

declare global {
  // React 19 browser tests need an explicit act environment flag.
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;


afterEach(async () => {
  await cleanupReactRoots();
});
