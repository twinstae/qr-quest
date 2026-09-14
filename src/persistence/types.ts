import type { Case } from "../domain/case.ts";
import type { PlaySession, StepAttempt } from "../domain/playSession.ts";
import type { Step } from "../domain/step.ts";

export interface CaseRepo {
  create(input: Omit<Case, "id">): Promise<Case>;
  getById(id: Case["id"]): Promise<Case | undefined>;
  getByEntryToken(token: string): Promise<Case | undefined>;
  list(): Promise<Case[]>;
  update(id: Case["id"], input: Omit<Case, "id">): Promise<Case>;
  /** CASE를 지우면 단계도 함께 지운다 (StepRepo.deleteByCaseId를 먼저 호출한다). */
  delete(id: Case["id"]): Promise<void>;
}

export interface StepRepo {
  create(input: Omit<Step, "id">): Promise<Step>;
  getById(id: Step["id"]): Promise<Step | undefined>;
  getByQrToken(token: string): Promise<Step | undefined>;
  listByCaseId(caseId: Step["caseId"]): Promise<Step[]>;
  update(id: Step["id"], input: Omit<Step, "id" | "caseId">): Promise<Step>;
  deleteByCaseId(caseId: Step["caseId"]): Promise<void>;
  /** 아직 단계가 없는 CASE에 새 단계를 붙일 때 쓸 순서. */
  nextOrder(caseId: Step["caseId"]): Promise<number>;
}

export interface PlaySessionRepo {
  create(input: Omit<PlaySession, "id">): Promise<PlaySession>;
  getById(id: PlaySession["id"]): Promise<PlaySession | undefined>;
  getByToken(token: string): Promise<PlaySession | undefined>;
  update(
    id: PlaySession["id"],
    input: Partial<Omit<PlaySession, "id" | "caseId" | "token">>,
  ): Promise<PlaySession>;
  listByCaseId(caseId: PlaySession["caseId"]): Promise<PlaySession[]>;
}

export interface StepAttemptRepo {
  create(input: Omit<StepAttempt, "id">): Promise<StepAttempt>;
  listBySessionId(sessionId: StepAttempt["sessionId"]): Promise<StepAttempt[]>;
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
