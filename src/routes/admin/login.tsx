import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import * as v from "valibot";

import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/admin/login")({
  component: RouteComponent,
});

// 로그인 후 이동할 관리자 페이지가 아직 없다 (ticket 06). 그룹 목록 페이지가
// 생기면 성공 시 그쪽으로 navigate 하도록 이 컴포넌트를 업데이트해야 한다.
function RouteComponent() {
  const [error, setError] = useState<string>();
  const [signedIn, setSignedIn] = useState(false);

  if (signedIn) {
    return <p>로그인되었습니다.</p>;
  }

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>관리자 로그인</Card.Title>
      </Card.Header>
      <Card.Body>
        <SimpleForm
          schema={v.object({
            email: v.pipe(v.string(), v.email("올바른 이메일을 입력해주세요")),
            password: v.pipe(v.string(), v.minLength(1, "비밀번호를 입력해주세요")),
          })}
          defaultValues={{ __brand: "ValidData", email: "", password: "" }}
          onSubmit={async ({ email, password }) => {
            const { error: signInError } = await authClient.signIn.email({ email, password });
            if (signInError) {
              setError(signInError.message ?? "로그인에 실패했습니다");
              return;
            }
            setError(undefined);
            setSignedIn(true);
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
  );
}
