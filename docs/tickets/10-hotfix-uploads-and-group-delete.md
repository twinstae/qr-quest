# 10. 운영 핫픽스 — 업로드 안내와 그룹 삭제

Status: Done. `bun run ci` 통과 (18 files / 105 tests, lint/format/typecheck clean).
PLAN.md item: 10
상위 설계: [../plans/qr-mystery-tour.md](../plans/qr-mystery-tour.md)

## Why

책방지기가 2026-09-05에 실제로 두 가지를 겪었다.

1. "이미지 파일을 첨부해보고 있는데요. 업로드에 실패하고 있어욤. 용량 때문일까요?"
   → 지금은 실패 이유를 알 수 없다. presign은 `contentType`이 `^image/`인지만 보고,
   용량은 아예 검사하지 않는다. 사용자는 왜 실패했는지, 몇 MB가 한도인지 모른다.
   개발자(김태희)가 "에러 처리를 해서 좀 더 자세한 안내 나오게 해놓을게요"라고 답한 항목.
2. "그룹목록을 삭제할 수는 없나욤?"
   → `QuestGroupRepo`에 delete가 없다. 잘못 만든 그룹을 지울 방법이 없다.

운영을 시작하기 전에 사장님이 이미 부딪힌 문제부터 없앤다.

## Scope

### 업로드 한도와 안내

- `ImageStorage.presignUpload` / `uploadService`에 검증을 추가한다.
  - 허용 형식: `image/jpeg`, `image/png`, `image/webp`, `image/gif`.
  - 용량 상한: 기본 5MB. 환경변수 `UPLOAD_MAX_BYTES`로 조정 가능하게 한다.
  - 실패는 도메인 에러로 구분한다: `FileTooLargeError`, `UnsupportedFileTypeError`.
    Elysia `.onError`에서 413 / 415로 매핑한다.
- **에러 응답에 숫자를 담는다**: `{ code, limitBytes, actualBytes }`.
  화면 문구: `5MB 이하만 올릴 수 있어요. 선택한 파일은 8.2MB예요.`
  형식 오류: `JPG, PNG, WebP, GIF 파일만 올릴 수 있어요.`
- 업로드 필드에 한도와 허용 형식을 미리 표시한다(`5MB 이하 · JPG, PNG, WebP, GIF`).

### 용량 자동 압축

- 서버가 거부하면 **1탭 자동 압축**을 제안한다.
  - canvas로 긴 변 1600px 리사이즈 → WebP 품질 0.82로 재인코딩.
  - 압축해도 사용자가 원본을 알 수 있게 "8.2MB → 1.4MB로 줄여서 올렸어요"를 보여준다.
  - 압축 결과가 여전히 한도를 넘으면 압축 단계를 한 번 더(긴 변 1200px) 시도하고, 그래도
    안 되면 원본으로 업로드를 막고 안내한다.
- 기존 `src/components/form/simple-field.tsx`의 업로드 경로와
  `src/components/ui/file-upload.tsx`를 재사용한다. 새 업로드 컴포넌트를 만들지 않는다.

### 그룹(CASE) 삭제

- `QuestGroupRepo.delete(id)` + `QuestRepo.deleteByGroupId(groupId)` +
  `questGroupService.deleteGroup` + `DELETE /api/groups/:id` (인증, `{ deleted: true }`).
- 그룹을 지우면 그 그룹의 퀘스트도 함께 삭제된다. 스키마의 FK는 RESTRICT이므로
  서비스가 자식(퀘스트)부터 지운다 — 409/`force` 같은 2단계 확인 대신, UI의 확인
  다이얼로그에서 "이 그룹의 Quest도 함께 삭제되고 되돌릴 수 없어요"로 미리 알린다.
- UI: `group-list-item.tsx`에 삭제 버튼 + 공용 `confirm-dialog.tsx`를 추가한다.
  카드가 링크 오버레이로 덮여 있어 버튼에 `position: relative; zIndex: 1`을 준다.

## 테스트 (RED 먼저)

- `src/application/uploadService.test.ts`
  - 한도 초과 → `FileTooLargeError` (메시지에 실제 byte 수 포함)
  - 허용되지 않는 형식 → `UnsupportedFileTypeError`
  - 한도 이하 정상 통과
- `src/application/questGroupService.test.ts` — 그룹 삭제 시 퀘스트도 함께 삭제,
  다른 그룹의 퀘스트는 유지, 퀘스트 없는 그룹도 삭제 가능.
- `src/api/elysia/app.test.ts` — 413/415 매핑과 응답 바디의 `limitBytes`·`actualBytes`·
  `allowedTypes`, 스토리지 미호출, `DELETE /api/groups/:id` 인증 필요 + 목록에서 사라짐.
- `src/persistence/drizzle/DrizzleQuestGroupRepo.test.ts` — `delete` 후 목록에서 제거.
- `src/persistence/drizzle/DrizzleQuestRepo.test.ts` — `deleteByGroupId`가 해당 그룹만 지운다.
- `src/lib/upload-image.test.ts` — 서버 오류 → 화면 이유 매핑(413/415/알 수 없음),
  성공 시 스토리지 PUT, PUT 실패 처리.
- `src/lib/compress-image.test.ts` — 긴 변 축소·WebP 재인코딩·용량 감소·세로 사진 처리.
- `src/components/form/simple-image-upload.test.tsx` — 한도 문구 표시, 한도 초과 시
  실제 크기 안내 + 자동 압축 제안, 압축 성공 시 줄어든 크기 안내, 지원하지 않는 형식 안내.
- `src/components/domains/confirm-dialog.test.tsx` — 열기/취소/확인/실패 시 재시도.

## 구현 노트 (구현하며 알게 된 것)

- **용량 한도는 컨텍스트(`AppContext.uploadLimits`)로 주입**한다. 애플리케이션 계층은
  `process.env`를 모르고, 실제 값은 `src/api/elysia/index.ts`가 `UPLOAD_MAX_BYTES`에서 읽는다.
- **스토리지 레벨에서도 한 번 더 막는다**: presign에 `ContentLength: byteSize`를 서명하므로
  검증된 크기보다 큰 파일은 S3/Supabase가 거부한다. 클라이언트가 크기를 거짓 보고해도 안전하다.
- **클라이언트는 용량을 미리 막지 않는다.** 서버가 판단한 값을 그대로 보여주는 편이
  설정(`UPLOAD_MAX_BYTES`)을 바꿔도 화면 안내가 어긋나지 않는다. 형식은 즉시 판단할 수 있지만
  일관성을 위해 같은 경로로 보낸다(415 + 지원 형식 안내).
- presign 스키마에서 `contentType`의 `^image/` 패턴을 **일부러 제거**했다. 스키마가 먼저
  거르면 "JPG, PNG, WebP, GIF만 올릴 수 있어요"라고 설명할 수 없는 400이 나가기 때문이다.
- 파일 입력을 고른 뒤 **`input` 이벤트와 `change` 이벤트를 모두** 보내야 한다(zag-js가
  `input`을 듣는다). 그래서 브라우저 테스트에서 테스트 유틸 대신 파일 선택을 직접 흉내낸다.
- 이미지가 아닌 파일(PDF 등)을 고르면 파일 목록 미리보기가 예외를 던졌다
  ("Preview Image is only supported for image files"). 이제 이미지일 때만
  `ItemPreviewImage`를 쓴다.
- 자동 압축은 긴 변 1600 → 1200 순으로 두 번까지 시도한 뒤, 그래도 크면 더 작은 사진을
  고르게 한다.

## Explicitly deferred

- 서버 측 이미지 재인코딩/썸네일 생성(클라이언트 압축으로 충분).
- 동영상 업로드 한도 정책 — [15](15-media-and-reveal.md)에서 다룬다.
- 그룹 수정(이름/설명) — [13](13-admin-case-editor.md)의 CASE 편집으로 흡수.

## Acceptance criteria

- 5MB를 넘는 이미지를 고르면 화면에 실제 한도와 실제 파일 크기가 숫자로 보인다.
- 지원하지 않는 형식을 고르면 지원 형식이 보인다.
- 한도 초과 이미지를 자동 압축으로 성공적으로 올릴 수 있고, 줄어든 크기를 확인할 수 있다.
- 그룹 목록에서 그룹을 삭제할 수 있고, 단계가 있는 그룹은 한 번 더 확인한다.

## Depends on

없음(기존 코드만 수정).
