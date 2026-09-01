import { createFileRoute, useNavigate } from "@tanstack/react-router";
import * as v from "valibot";

import { SimpleImageUpload, SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import { getApiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/_authed/groups/$groupId/quests/new")({
  component: RouteComponent,
});

const ImageValueSchema = v.object({
  src: v.pipe(v.string(), v.minLength(1, "이미지를 업로드해주세요")),
  alt: v.string(),
});

function RouteComponent() {
  const { groupId } = Route.useParams();
  const navigate = useNavigate();

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Quest 생성</Card.Title>
      </Card.Header>
      <Card.Body>
        <SimpleForm
          schema={v.object({
            content: v.pipe(v.string(), v.minLength(1, "문제를 입력해주세요")),
            image: ImageValueSchema,
            answer: v.pipe(v.string(), v.minLength(1, "정답을 입력해주세요")),
            placeholder: v.string(),
            hint: v.pipe(v.string(), v.minLength(1, "힌트를 입력해주세요")),
            rewardText: v.string(),
            rewardImage: v.optional(ImageValueSchema),
          })}
          defaultValues={{
            __brand: "ValidData",
            content: "",
            image: { src: "", alt: "" },
            answer: "",
            placeholder: "",
            hint: "",
            rewardText: "",
            rewardImage: undefined,
          }}
          onSubmit={async ({
            content,
            image,
            answer,
            placeholder,
            hint,
            rewardText,
            rewardImage,
          }) => {
            const client = getApiClient();
            await client.quests.post({
              groupId,
              content,
              image,
              answer,
              placeholder,
              hint,
              rewardText: rewardText || undefined,
              rewardImage,
            });
            await navigate({ to: "/admin/groups/$groupId", params: { groupId } });
          }}
        >
          <SimpleInput name="content" label="문제" />
          <SimpleImageUpload name="image" label="문제 이미지" required />
          <SimpleInput name="answer" label="정답" />
          <SimpleInput name="placeholder" label="입력창 안내 문구 (선택)" />
          <SimpleInput name="hint" label="힌트" />
          <SimpleInput name="rewardText" label="정답 시 보여줄 문구 (선택)" />
          <SimpleImageUpload name="rewardImage" label="정답 시 보여줄 이미지 (선택)" />

          <Button type="submit" color="primary" className="mt-2">
            Quest 만들기
          </Button>
        </SimpleForm>
      </Card.Body>
    </Card.Root>
  );
}
