import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import { Pencil, Plus } from "lucide-react";

import { DialogShell } from "@/components/domains/dialog-shell.tsx";
import {
  EMPTY_QUEST_EDITOR_VALUES,
  QuestEditorForm,
  type QuestEditorDefaultValues,
} from "@/components/domains/quest-editor-form.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Spinner } from "@/components/ui/spinner.tsx";
import { getApiClient } from "@/lib/api-client";
import { styled } from "styled-system/jsx";

const LoadingBody = styled("div", {
  base: {
    display: "flex",
    justifyContent: "center",
    py: "12",
  },
});

export function CreateQuestDialog({ groupId }: { groupId: string }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <DialogShell
      title="Quest 추가"
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button>
          <Plus /> Quest 추가
        </Button>
      }
    >
      <QuestEditorForm
        submitLabel="Quest 만들기"
        defaultValues={EMPTY_QUEST_EDITOR_VALUES}
        onCancel={() => setOpen(false)}
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
          setOpen(false);
          await router.invalidate();
        }}
      />
    </DialogShell>
  );
}

export function EditQuestDialog({ questId }: { questId: string }) {
  const [open, setOpen] = useState(false);
  const [defaultValues, setDefaultValues] = useState<QuestEditorDefaultValues | null>(null);
  const router = useRouter();

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && !defaultValues) {
      const client = getApiClient();
      const { data: quest } = await client.quests({ id: questId }).edit.get();
      if (!quest) return;
      setDefaultValues({
        content: quest.content,
        image: quest.image,
        answer: quest.answer,
        placeholder: quest.placeholder,
        hint: quest.hint,
        rewardText: quest.reward.text ?? "",
        rewardImage: quest.reward.image,
      });
    }
  }

  return (
    <DialogShell
      title="Quest 수정"
      open={open}
      onOpenChange={handleOpenChange}
      trigger={
        <Button variant="outline" size="sm">
          <Pencil /> 수정
        </Button>
      }
    >
      {defaultValues ? (
        <QuestEditorForm
          submitLabel="저장"
          defaultValues={defaultValues}
          onCancel={() => setOpen(false)}
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
            await client.quests({ id: questId }).patch({
              content,
              image,
              answer,
              placeholder,
              hint,
              rewardText: rewardText || undefined,
              rewardImage,
            });
            setOpen(false);
            await router.invalidate();
          }}
        />
      ) : (
        <LoadingBody>
          <Spinner size="lg" />
        </LoadingBody>
      )}
    </DialogShell>
  );
}
