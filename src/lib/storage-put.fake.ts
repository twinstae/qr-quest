// 브라우저 테스트와 Storybook에서 @/lib/storage-put 대신 alias로 연결된다.
// 가짜 저장소는 항상 받아 준다. 실패 처리는 upload-image.test.ts가 put을 직접 넘겨 확인한다.
import type { PutToStorage } from "./storage-put.ts";

export const putToStorage: PutToStorage = async () => true;
