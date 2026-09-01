import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import * as v from "valibot";

import { SimpleInput } from "@/components/form/simple-field";
import { SimpleForm } from "@/components/form/simple-form";
import { Button } from "@/components/ui/button.tsx";
import * as Card from "@/components/ui/card.tsx";
import { getApiClient } from "@/lib/api-client";

export const Route = createFileRoute("/admin/_authed/groups/")({
  component: RouteComponent,
  loader: async () => {
    const client = getApiClient();
    const { data } = await client.groups.get();
    return { groups: data ?? [] };
  },
});

function RouteComponent() {
  const { groups } = Route.useLoaderData();
  const router = useRouter();

  return (
    <Card.Root>
      <Card.Header>
        <Card.Title>Quest 그룹</Card.Title>
      </Card.Header>
      <Card.Body>
        <ul>
          {groups.map((group) => (
            <li key={group.id}>
              <Link to="/admin/groups/$groupId" params={{ groupId: group.id }}>
                {group.name}
              </Link>
              {group.description && <span> — {group.description}</span>}
            </li>
          ))}
        </ul>

        <SimpleForm
          schema={v.object({
            name: v.pipe(v.string(), v.minLength(1, "그룹 이름을 입력해주세요")),
            description: v.string(),
          })}
          defaultValues={{ __brand: "ValidData", name: "", description: "" }}
          onSubmit={async ({ name, description }) => {
            const client = getApiClient();
            await client.groups.post({ name, description: description || undefined });
            await router.invalidate();
          }}
        >
          <SimpleInput name="name" label="그룹 이름" placeholder="Library Event 2026" />
          <SimpleInput name="description" label="설명 (선택)" />
          <Button type="submit" color="primary" className="mt-2">
            그룹 만들기
          </Button>
        </SimpleForm>
      </Card.Body>
    </Card.Root>
  );
}
