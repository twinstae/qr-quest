import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import * as v from "valibot";

import { DialogShell } from "@/components/domains/dialog-shell.tsx";
import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import { getApiClient } from "@/lib/api-client";
import { styled } from "styled-system/jsx";

const Footer = styled("div", {
  base: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "3",
    pt: "2",
  },
});

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <DialogShell
      title="그룹 추가"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Plus /> 그룹 추가
        </Button>
      }
    >
      <SimpleForm
        schema={v.object({
          name: v.pipe(v.string(), v.minLength(1, "그룹 이름을 입력해주세요")),
          description: v.string(),
        })}
        defaultValues={{ name: "", description: "" }}
        onSubmit={async ({ name, description }) => {
          const client = getApiClient();
          await client.groups.post({ name, description: description || undefined });
          setOpen(false);
          await router.invalidate();
        }}
      >
        <SimpleInput name="name" label="그룹 이름" placeholder="Library Event 2026" />
        <SimpleInput name="description" label="설명 (선택)" />
        <Footer>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button type="submit">그룹 만들기</Button>
        </Footer>
      </SimpleForm>
    </DialogShell>
  );
}
