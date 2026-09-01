1. [ ] Quest 페이지의 QR 코드를 생성할 수 있다 ([ticket](docs/tickets/01-qr-code-generation.md))
2. [x] Quest 페이지에서 Quest를 풀 수 있다 ([ticket](docs/tickets/02-quest-solving.md))
3. [x] 답을 맞추면 뭔가를 보여준다 ([ticket](docs/tickets/03-show-reward-on-correct-answer.md))
4. [x] Quest를 생성할 수 있다 ([ticket](docs/tickets/04-create-quest.md))
5. [x] Quest를 수정할 수 있다 ([ticket](docs/tickets/05-update-quest.md))
6. [x] Quest 그룹 목록에서 그룹을 선택할 수 있다 ([ticket](docs/tickets/06-select-quest-group.md))
7. [ ] admin 은 passkey로 로그인할 수 있다. ([ticket](docs/tickets/07-admin-login.md) — v1 scope is email+password only, passkey deferred)
8. [ ] 실제 데이터베이스에 연결된다 ([ticket](docs/tickets/08-database-connection.md))
9. [ ] 배포되서 링크로 진입할 수 있다 ([ticket](docs/tickets/09-deployment.md))

Recommended build order (dependency-driven, not the numbering above):
[08](docs/tickets/08-database-connection.md) → [03](docs/tickets/03-show-reward-on-correct-answer.md) →
[07](docs/tickets/07-admin-login.md) → [06](docs/tickets/06-select-quest-group.md) →
[04](docs/tickets/04-create-quest.md) → [05](docs/tickets/05-update-quest.md) →
[01](docs/tickets/01-qr-code-generation.md) → [09](docs/tickets/09-deployment.md)
