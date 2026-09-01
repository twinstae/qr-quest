import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import * as v from "valibot";

import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
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
  },
});

function RouteComponent() {
  const navigate = useNavigate();
  const [error, setError] = useState<string>();

  return (
    <CenterMain>
      <Card.Root minWidth="400px" maxWidth="screen">
        <Card.Header>
          <Card.Title>관리자 로그인</Card.Title>
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
              await navigate({ to: "/admin/groups" });
            }}
          >
            <SimpleInput name="email" label="이메일" placeholder="admin@example.com" />
            <SimpleInput name="password" label="비밀번호" type="password" />
            <Button type="submit" color="primary" className="mt-2">
              로그인
            </Button>
          </SimpleForm>
          {error && <p>{error}</p>}
        </Card.Body>
      </Card.Root>
    </CenterMain>
  );
}
