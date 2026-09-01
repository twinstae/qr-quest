import { SimpleCheckbox, SimpleInput } from "@/components/form/simple-field.tsx";
import { SimpleForm } from "@/components/form/simple-form.tsx";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import { validDataSchema, type ValidData, type ValidDataInput } from "./schema.ts";
import { css } from "styled-system/css";

export function ExapmleForm({
  addData,
  initData,
}: {
  addData: (data: ValidData) => Promise<void>;
  initData: Partial<ValidDataInput>;
}) {
  return (
    <Card.Root className={css({ width: "400px" })}>
      <Card.Header>
        <Card.Title>카드 제목이고요</Card.Title>
        <Card.Description>설명입니다</Card.Description>
      </Card.Header>
      <Card.Body>
        <SimpleForm
          schema={validDataSchema}
          defaultValues={{
            __brand: "ValidData",
            name: "",
            consent: false,
            ...initData,
          }}
          onSubmit={addData}
        >
          <SimpleInput name="name" label="이름" hint="힌트입니다만." />

          <SimpleCheckbox name="consent" label="약관 동의" />

          <Button type="submit" color="primary" className="mt-2">
            추가하기
          </Button>
        </SimpleForm>
      </Card.Body>
    </Card.Root>
  );
}
