1. [x] Quest 페이지의 QR 코드를 생성할 수 있다 ([ticket](docs/tickets/01-qr-code-generation.md))
2. [x] Quest 페이지에서 Quest를 풀 수 있다 ([ticket](docs/tickets/02-quest-solving.md))
3. [x] 답을 맞추면 뭔가를 보여준다 ([ticket](docs/tickets/03-show-reward-on-correct-answer.md))
4. [x] Quest를 생성할 수 있다 ([ticket](docs/tickets/04-create-quest.md))
5. [x] Quest를 수정할 수 있다 ([ticket](docs/tickets/05-update-quest.md))
6. [x] Quest 그룹 목록에서 그룹을 선택할 수 있다 ([ticket](docs/tickets/06-select-quest-group.md))
7. [ ] admin 은 passkey로 로그인할 수 있다. ([ticket](docs/tickets/07-admin-login.md) — v1 scope is email+password only, passkey deferred)
8. [x] 실제 데이터베이스에 연결된다 ([ticket](docs/tickets/08-database-connection.md))
9. [x] 배포되서 링크로 진입할 수 있다 ([ticket](docs/tickets/09-deployment.md))

## 책방79-1 QR 미스터리 투어 (CASE/STEP 투어 시스템)

설계: [docs/plans/qr-mystery-tour.md](docs/plans/qr-mystery-tour.md)

10. [x] 업로드 실패 이유와 한도를 안내하고, 큰 이미지는 자동 압축한다 + 그룹을 삭제할 수 있다 ([ticket](docs/tickets/10-hotfix-uploads-and-group-delete.md))
11. [x] CASE/STEP/참가 세션 모델로 데이터 구조를 정리한다 ([ticket](docs/tickets/11-case-step-session-model.md) — 도메인 규칙 + 전체 rename 완료, 세션 API는 12에서)
12. [x] 참가자가 시작 QR부터 사건 종결까지 순차적으로 투어를 진행한다 (서버 잠금·재개 포함) ([ticket](docs/tickets/12-player-tour-flow.md))
13. [x] 관리자가 개발자 없이 CASE를 만들고 STEP을 편집한다 (복제·미리보기·테스트 모드·상태) ([ticket](docs/tickets/13-admin-case-editor.md))
14. [x] CASE별 QR을 인쇄하고 설치를 점검한다 (고정 URL 유지) ([ticket](docs/tickets/14-qr-operations.md))
15. [x] 단서 공개 연출 프리셋과 동영상·효과음을 지원한다 ([ticket](docs/tickets/15-media-and-reveal.md))
16. [ ] 완료 인증번호를 발급·리딤하고 참가 통계를 본다 ([ticket](docs/tickets/16-completion-code-and-stats.md))

Recommended build order (dependency-driven, not the numbering above):
[08](docs/tickets/08-database-connection.md) → [03](docs/tickets/03-show-reward-on-correct-answer.md) →
[07](docs/tickets/07-admin-login.md) → [06](docs/tickets/06-select-quest-group.md) →
[04](docs/tickets/04-create-quest.md) → [05](docs/tickets/05-update-quest.md) →
[01](docs/tickets/01-qr-code-generation.md) → [09](docs/tickets/09-deployment.md)

Tour build order:
[10](docs/tickets/10-hotfix-uploads-and-group-delete.md) (운영 핫픽스) →
[11](docs/tickets/11-case-step-session-model.md) → [12](docs/tickets/12-player-tour-flow.md) →
[16](docs/tickets/16-completion-code-and-stats.md) 중 인증번호 →
[13](docs/tickets/13-admin-case-editor.md) → [14](docs/tickets/14-qr-operations.md) →
[15](docs/tickets/15-media-and-reveal.md) → [16](docs/tickets/16-completion-code-and-stats.md) 중 통계

Phase 1(11·12)이 끝나면 체험비를 받고 실제 운영이 가능하고,
Phase 2(13·14)가 끝나면 사장님이 개발자 없이 CASE 02를 만들 수 있다.
