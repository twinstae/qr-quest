import { QuestCardForm } from "@/components/domains/quest-card";
import { createFileRoute } from "@tanstack/react-router";
import { styled } from "styled-system/jsx";

export const Route = createFileRoute("/quest/$questId")({
  component: RouteComponent,
});

const VStack = styled("div", {
  base: {
    display: "flex",
    flexDirection: "column",
    gap: "4",
  },
});

const TEST_QUEST = {
  id: "2131abcd",
  image: {
    src: "https://press.knou.ac.kr/com/file/getImage.do?fileName=0000000000000004000000001.jpg&filePath=/public/cmdtimages",
    alt: "헌법논증이론 표지",
  },
  content: "헌법논증이론의 저자는 누구일까요?",
  answer: "이민열, 김도균",
  alternatives: ["이한"],
  placeholder: "ㅇㅇㅇ, ㅁㅁㅁ",
  hint: "표지 안에 답이 있습니다",
};

function RouteComponent() {
  const quest = TEST_QUEST;
  return (
    <VStack minHeight="screen">
      <QuestCardForm
        quest={quest}
        onSubmit={async ({ answer }) => {
          if (answer === TEST_QUEST.answer) {
            alert("정답입니다~");
          } else {
            alert("틀렸습니다~");
          }
        }}
      />
    </VStack>
  );
}
