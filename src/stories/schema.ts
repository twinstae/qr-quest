import * as v from "valibot";

export const validDataSchema = v.pipe(
  v.object({
    __brand: v.literal("ValidData"),
    name: v.pipe(
      v.string(),
      v.minLength(1, "이름을 입력해주세요"),
      v.maxLength(100, "이름은 100자 이하로 입력해주세요"),
    ),
    consent: v.literal(true, "약관에 동의해주세요"),
  }),
);

export type ValidData = v.InferOutput<typeof validDataSchema>;
export type ValidDataInput = v.InferInput<typeof validDataSchema>;
