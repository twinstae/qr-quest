import type { Quest } from "../domain/quest.ts";
import type { QuestGroup } from "../domain/questGroup.ts";

export interface QuestRepo {
  getById(id: Quest["id"]): Promise<Quest | undefined>;
  create(input: Omit<Quest, "id">): Promise<Quest>;
  update(id: Quest["id"], input: Omit<Quest, "id" | "groupId">): Promise<Quest>;
  listByGroupId(groupId: Quest["groupId"]): Promise<Quest[]>;
  /** 그룹을 지울 때 자식부터 지운다 (스키마의 FK는 RESTRICT라 순서가 필요하다). */
  deleteByGroupId(groupId: Quest["groupId"]): Promise<void>;
}

export interface QuestGroupRepo {
  create(input: Omit<QuestGroup, "id">): Promise<QuestGroup>;
  list(): Promise<QuestGroup[]>;
  delete(id: QuestGroup["id"]): Promise<void>;
}

export interface ImageStorage {
  /**
   * byteSize는 실제 스토리지에도 서명된다(S3 Content-Length) — 검증을 통과한 크기보다
   * 큰 파일이 올라가지 않도록 스토리지 레벨에서 한 번 더 막는다.
   */
  presignUpload(input: {
    filename: string;
    contentType: string;
    byteSize: number;
  }): Promise<{ uploadUrl: string; publicUrl: string }>;
}
