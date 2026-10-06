import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { given, runSiheom } from "@siheom/react";

import { SortableList } from "./sortable-list.tsx";

function itemByText(text: string): HTMLElement {
  const found = [...document.querySelectorAll<HTMLElement>("[draggable='true']")].find((element) =>
    element.textContent?.includes(text),
  );
  if (!found) throw new Error(`no draggable item with text=${text}`);
  return found;
}

function drag(from: HTMLElement, to: HTMLElement) {
  fireEvent.dragStart(from);
  fireEvent.dragEnter(to);
  fireEvent.dragOver(to);
  fireEvent.drop(to);
  fireEvent.dragEnd(from);
}

describe("SortableList", () => {
  it("항목을 다른 항목 위로 끌어다 놓으면 onMove(from, to)를 부른다", async () => {
    const moves: [number, number][] = [];

    await runSiheom(
      given.render(
        <SortableList
          items={["첫째", "둘째", "셋째"]}
          getKey={(item) => item}
          onMove={(from, to) => {
            moves.push([from, to]);
          }}
          renderItem={(item) => <p>{item}</p>}
        />,
      ),
    );

    drag(itemByText("첫째"), itemByText("셋째"));
    drag(itemByText("셋째"), itemByText("둘째"));

    expect(moves).toEqual([
      [0, 2],
      [2, 1],
    ]);
  });

  it("제자리에 놓으면 onMove를 부르지 않는다", async () => {
    let moveCount = 0;

    await runSiheom(
      given.render(
        <SortableList
          items={["첫째", "둘째"]}
          getKey={(item) => item}
          onMove={() => {
            moveCount += 1;
          }}
          renderItem={(item) => <p>{item}</p>}
        />,
      ),
    );

    drag(itemByText("첫째"), itemByText("첫째"));

    expect(moveCount).toBe(0);
  });
});
