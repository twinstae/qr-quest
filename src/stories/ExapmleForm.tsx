import { SimpleCheckbox, SimpleInput } from "@/components/form/simple-field.tsx";
import { SimpleForm } from "@/components/form/simple-form.tsx";
import { Button } from "@/components/ui/button";
import { validDataSchema, type ValidData, type ValidDataInput } from "./schema";
import { css } from "styled-system/css";

export function ExapmleForm({
  addData,
  initData,
}: {
  addData: (data: ValidData) => Promise<void>;
  initData: Partial<ValidDataInput>;
}) {
  return (
    <SimpleForm
      schema={validDataSchema}
      defaultValues={{
        __brand: "ValidData",
        name: "",
        consent: false,
        ...initData,
      }}
      className={css({ maxWidth: "400px" })}
      onSubmit={addData}
    >
      <SimpleInput name="name" label="이름" hint="힌트입니다만." />

      <SimpleCheckbox name="consent" label="약관 동의" />

      <Button type="submit" color="primary" className="mt-2">
        추가하기
      </Button>
    </SimpleForm>
  );
}
