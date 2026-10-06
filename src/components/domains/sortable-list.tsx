import { GripVertical } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";

import { css } from "styled-system/css";

const itemStyle = css({
  display: "flex",
  alignItems: "stretch",
  gap: "1",
  borderRadius: "l2",
  transition: "opacity 0.15s",
  "&[data-dragging]": { opacity: 0.4 },
  // 놓을 자리를 알려준다.
  "&[data-over]": { outline: "2px solid", outlineColor: "fg.muted", outlineOffset: "2px" },
});

const handleStyle = css({
  display: "flex",
  alignItems: "center",
  color: "fg.subtle",
  cursor: "grab",
  _active: { cursor: "grabbing" },
});

/**
 * 끌어다 놓아 순서를 바꾸는 목록. 브라우저 기본 드래그(HTML5 DnD)만 써서 의존성이 없다.
 * 키보드·터치 사용자는 항목 안의 위/아래 버튼을 그대로 쓴다.
 */
export function SortableList<T>({
  items,
  getKey,
  renderItem,
  onMove,
}: {
  items: readonly T[];
  getKey: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  onMove: (from: number, to: number) => void;
}) {
  const [draggingIndex, setDraggingIndex] = useState<number>();
  const [overIndex, setOverIndex] = useState<number>();
  // drop은 dragstart 직후 같은 틱에 올 수 있다 — 렌더를 기다리지 않는 ref로 판단한다.
  const draggingRef = useRef<number>(undefined);

  function reset() {
    draggingRef.current = undefined;
    setDraggingIndex(undefined);
    setOverIndex(undefined);
  }

  return (
    <>
      {items.map((item, index) => (
        <div
          key={getKey(item)}
          draggable
          onDragStart={(event) => {
            // Firefox는 데이터가 없으면 드래그를 시작하지 않는다.
            event.dataTransfer?.setData("text/plain", String(index));
            draggingRef.current = index;
            setDraggingIndex(index);
          }}
          onDragEnter={() => setOverIndex(index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const from = draggingRef.current;
            if (from !== undefined && from !== index) onMove(from, index);
            reset();
          }}
          onDragEnd={reset}
          data-dragging={draggingIndex === index ? "" : undefined}
          data-over={
            draggingIndex !== undefined && overIndex === index && draggingIndex !== index
              ? ""
              : undefined
          }
          className={itemStyle}
        >
          <span aria-hidden className={handleStyle}>
            <GripVertical size={16} />
          </span>
          <div className={css({ flex: "1", minWidth: "0" })}>{renderItem(item, index)}</div>
        </div>
      ))}
    </>
  );
}
