import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import * as v from "valibot";

import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { SubmitButton } from "@/components/form/submit-button";
import * as Card from "@/components/ui/card.tsx";
import { authClient } from "@/lib/auth-client";
import { styled } from "styled-system/jsx";

export const Route = createFileRoute("/admin/login")({
  component: RouteComponent,
});

const CenterMain = styled("main", {
  base: {
    minHeight: "screen",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    px: "4",
  },
});

const ErrorText = styled("p", {
  base: {
    color: "error",
    textStyle: "sm",
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();

  return (
    <CenterMain>
      <Card.Root variant="elevated" width="full" maxWidth="sm">
        <Card.Header>
          <Card.Title textStyle="xl">관리자 로그인</Card.Title>
        </Card.Header>
        <Card.Body>
          <SimpleForm
            schema={v.object({
              email: v.pipe(v.string(), v.email("올바른 이메일을 입력해주세요")),
              password: v.pipe(v.string(), v.minLength(1, "비밀번호를 입력해주세요")),
            })}
            defaultValues={{ email: "", password: "" }}
            onSubmit={async ({ email, password }) => {
              const { error: signInError } = await authClient.signIn.email({ email, password });
              if (signInError) {
                setError(signInError.message ?? "로그인에 실패했습니다");
                return;
              }
              setError(undefined);
              await navigate({ to: "/admin/cases" });
            }}
          >
            <SimpleInput name="email" label="이메일" placeholder="admin@example.com" />
            <SimpleInput name="password" label="비밀번호" type="password" />
            {error && <ErrorText role="alert">{error}</ErrorText>}
            <SubmitButton width="full">로그인</SubmitButton>
          </SimpleForm>
        </Card.Body>
      </Card.Root>
    </CenterMain>
  );
}
