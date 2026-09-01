import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

import * as Card from "@/components/ui/card.tsx";
import { css } from "styled-system/css";
import { Flex } from "styled-system/jsx";
import { linkOverlay } from "styled-system/patterns";

export type QuestGroupSummary = {
  id: string;
  name: string;
  description?: string;
};

export function GroupListItem({ group }: { group: QuestGroupSummary }) {
  return (
    <Card.Root
      variant="outline"
      position="relative"
      transition="colors"
      _hover={{ borderColor: "colorPalette.outline.border", bg: "gray.subtle.bg" }}
    >
      <Card.Header>
        <Flex justify="space-between" align="flex-start" gap="2">
          <Card.Title>
            <Link
              to="/admin/groups/$groupId"
              params={{ groupId: group.id }}
              className={linkOverlay()}
            >
              {group.name}
            </Link>
          </Card.Title>
          <ChevronRight className={css({ color: "fg.subtle", flexShrink: "0" })} />
        </Flex>
        {group.description && <Card.Description>{group.description}</Card.Description>}
      </Card.Header>
    </Card.Root>
  );
}
