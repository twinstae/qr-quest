import { describe, expect, it } from "vitest";

import { runSiheom, query, given, assertions, actions } from "@siheom/react";
import type { ValidData } from "./schema.ts";
import { ExapmleForm } from "./ExapmleForm.tsx";
import * as Stories from "./ExampleForm.stories.tsx";

describe("ExapmleForm", () => {
  it("새 데이터를 추가할 수 있다", async () => {
    let result: ValidData | undefined;

    await runSiheom(
      // given
      given.render(
        <ExapmleForm
          {...Stories.Empty.args}
          addData={async (data) => {
            result = data;
          }}
        />,
      ),

      actions.fill(query.textbox("이름"), "김태희"),
      actions.click(query.checkbox("약관 동의")),

      actions.click(query.button("추가하기")),
    );

    // then 올바른 값이 제출됨
    expect(result).toStrictEqual({
      __brand: "ValidData",
      consent: true,
      name: "김태희",
    });
  });

  it("아무 값도 입력하지 않고 추가할 수 없다", async () => {
    let result: ValidData | undefined;

    await runSiheom(
      given.render(
        <ExapmleForm
          {...Stories.Empty.args}
          addData={async (data) => {
            result = data;
          }}
        />,
      ),
      actions.click(query.button("추가하기")),
      assertions.errormessage(query.textbox("이름"), "이름을 입력해주세요"),
      assertions.errormessage(query.checkbox("약관 동의"), "약관에 동의해주세요"),
    );

    expect(result).toBeUndefined();
  });
});
