import { describe, it } from "vitest";
import { actions, assertions, effect, given, query, runSiheom, withFakeTimers } from "@siheom/react";
import * as v from "valibot";

import { SimpleForm } from "./simple-form.tsx";
import { SubmitButton } from "./submit-button.tsx";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function renderSlowForm() {
  return (
    <SimpleForm schema={v.object({})} defaultValues={{}} onSubmit={() => sleep(200)}>
      <SubmitButton>제출</SubmitButton>
    </SimpleForm>
  );
}

describe("SubmitButton", () => {
  it("제출이 오래 걸리는 동안 로딩 상태로 비활성화되고, 끝나면 다시 활성화된다", async () => {
    await runSiheom(
      given.render(renderSlowForm()),
      withFakeTimers(
        actions.click(query.button("제출")),
        assertions.disabled(query.button(/.*/)),
        effect.elapsed(200),
        assertions.visible(query.button("제출")),
      ),
    );
  });
});
