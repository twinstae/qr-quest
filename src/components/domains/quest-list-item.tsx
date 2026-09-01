import { EditQuestDialog } from "@/components/domains/quest-form-dialog.tsx";
import { QuestQrCodeDownload } from "@/components/domains/quest-qr-code.tsx";
import * as Card from "@/components/ui/card.tsx";
import { css } from "styled-system/css";
import { AspectRatio } from "styled-system/jsx";

export type QuestListItemData = {
  id: string;
  content: string;
  image: { src: string; alt: string };
  answer: string;
};

export function QuestListItem({ quest }: { quest: QuestListItemData }) {
  return (
    <Card.Root variant="outline" overflow="hidden">
      <AspectRatio ratio={4 / 3}>
        <img
          src={quest.image.src}
          alt={quest.image.alt}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AspectRatio>
      <Card.Header pb="2">
        <Card.Title>{quest.content}</Card.Title>
        <Card.Description>
          정답:{" "}
          <span className={css({ fontWeight: "semibold", color: "fg.default" })}>
            {quest.answer}
          </span>
        </Card.Description>
      </Card.Header>
      <Card.Footer justifyContent="space-between" alignItems="center">
        <QuestQrCodeDownload questId={quest.id} />
        <EditQuestDialog questId={quest.id} />
      </Card.Footer>
    </Card.Root>
  );
}
