# 17. 큰 이미지 자동 압축

Status: Not started.
PLAN.md item: 17

## Why

PNG 스크린샷·디자인 파일은 쉽게 5MB를 넘는다. 지금은 서버가 거부한 뒤
[자동 압축해서 올리기] 버튼을 눌러야 한다. 한 번 더 누를 이유가 없다.

## 결정

- 서버가 413(`FILE_TOO_LARGE`)을 돌려주면 **버튼 없이 바로** 압축해서 다시 올린다.
  클라이언트는 여전히 용량을 미리 판단하지 않는다 — 한도는 서버(`UPLOAD_MAX_BYTES`)가 정한다.
- 형식 규칙
  - PNG(그 밖의 무손실 형식) → WebP.
  - JPG/JPEG/JFIF → JPEG로 다시 인코딩한다 (형식 유지).
  - GIF → 압축하지 않는다 (애니메이션이 사라진다). 한도 초과 안내만 한다.
  - 동영상 → 지금처럼 압축하지 않는다.
- 긴 변 1600px → 그래도 크면 1200px. 두 번 해도 크면 업로드를 막고 안내한다.
- 성공하면 지금처럼 `8.2MB → 1.4MB로 줄여서 올렸어요.`

## 테스트

- `src/lib/compress-image.test.ts` — JPEG 입력은 JPEG로, PNG 입력은 WebP로.
- `src/components/form/simple-image-upload.test.tsx` — 413 뒤 버튼 없이 압축 업로드,
  두 번 실패하면 안내, GIF는 압축하지 않음.
