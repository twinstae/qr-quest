import { describe, expect, it } from "vitest";

import { moveItem } from "./move-item.ts";

describe("moveItem", () => {
  it("앞에서 뒤로 옮긴다", () => {
    expect(moveItem(["a", "b", "c", "d"], 0, 2)).toEqual(["b", "c", "a", "d"]);
  });

  it("뒤에서 앞으로 옮긴다", () => {
    expect(moveItem(["a", "b", "c", "d"], 3, 1)).toEqual(["a", "d", "b", "c"]);
  });

  it("같은 자리면 그대로다", () => {
    expect(moveItem(["a", "b"], 1, 1)).toEqual(["a", "b"]);
  });

  it("원본 배열은 바꾸지 않는다", () => {
    const original = ["a", "b", "c"];
    moveItem(original, 0, 2);
    expect(original).toEqual(["a", "b", "c"]);
  });

  it("범위를 벗어나면 그대로 돌려준다", () => {
    expect(moveItem(["a", "b"], 5, 0)).toEqual(["a", "b"]);
  });
});
