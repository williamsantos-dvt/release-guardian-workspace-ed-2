## Context

See `proposal.md` for motivation. The current engine in `apps/api/src/services/releaseService.ts` emits `GO` or `NO_GO` only, with a hard-coded coverage check at 70. `REVIEW` already exists in the public contract (`packages/contracts/src/index.ts`) and is consumed by API, dashboard, and simulator, but is not produced by the engine. The in-memory repository re-evaluates all 18 seed evidences on boot, so any policy change shifts historical aggregates immediately.

## Goals / Non-Goals

**Goals:**
- Derive decision bands from coverage thresholds: `<70` => `NO_GO`, `>=70 && <80` => `REVIEW`, `>=80` => `GO`.
- Preserve existing blocking semantics for mandatory test failures, critical vulnerabilities, and lint errors.
- Keep request/response contract unchanged for `POST /api/v1/evaluations`.
- Keep reasons aligned with canonical `REASON_CODES` ordering.
- Keep exposed policy metadata and tests aligned with runtime behavior.

**Non-Goals:**
- No contract changes in `packages/contracts` for payload shape or enum values.
- No new persistence layer, dependency, or infrastructure component.
- No unrelated bug fixes outside the change scope (e.g., `?limit=` behavior, dead code cleanup).

## Decisions

### Decision 1: Centralize thresholds in constants and consume them in engine
- **Choice:** Introduce/use explicit coverage band constants in `apps/api/src/constants.ts` and remove hard-coded coverage literals from `releaseService.ts`.
- **Rationale:** Fixes divergence between constants, runtime, and policy snapshot (`GET /api/v1/policy`) while making threshold evolution auditable.
- **Alternative considered:** Keep literals in service and mirror them in constants/docs. Rejected because it repeats D-01/D-02 drift risk.

### Decision 2: Keep non-coverage blockers as NO_GO overrides
- **Choice:** Decision derivation becomes two-stage: coverage computes baseline (`NO_GO`/`REVIEW`/`GO`), then blocking signals (`tests.failed`, `security.critical`, `lintErrors`) force `NO_GO`.
- **Rationale:** Preserves established safety behavior and existing reason semantics while introducing `REVIEW` for intermediate coverage-only cases.
- **Alternative considered:** Coverage-only decision with no blocker overrides. Rejected because it would silently relax existing release safety behavior and contradict baseline test intent.

### Decision 3: Preserve reason ordering via canonical contract source
- **Choice:** Maintain reason emission aligned to `REASON_CODES` order (`COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `LINT_ERRORS`).
- **Rationale:** Consumers and tests rely on stable ordering and shared contract authority.
- **Alternative considered:** Dynamic sorting by severity/context. Rejected because it breaks canonical ordering and increases drift risk.

### Decision 4: Align all policy touchpoints in one migration
- **Choice:** Update and validate agreement across `constants.ts`, `releaseService.ts`, `GET /api/v1/policy`, `REASON_CODES`, tests, `docs/release-policy.md`, and `POLICY_VERSION`.
- **Rationale:** The baseline shows these points drift independently; doing this as one cohesive migration reduces partial-update regressions.
- **Alternative considered:** Incremental file-by-file updates across multiple PRs. Rejected because seed re-evaluation and test coupling make partial states unstable.

## Risks / Trade-offs

- **[Seed aggregate drift]** Historical `byDecision` changes after startup re-evaluation can break fixed-count tests and scripts → **Mitigation:** update expected aggregates and explicitly document moved seed IDs.
- **[Policy metadata mismatch]** `GET /api/v1/policy` can diverge from engine if thresholds are not shared constants → **Mitigation:** single source in `constants.ts` and tests that assert snapshot values.
- **[Reason regression]** Introducing `REVIEW` may accidentally drop or reorder reasons in `NO_GO` paths → **Mitigation:** add/adjust policy tests for ordered multi-reason scenarios.
- **[Versioning ambiguity]** Behavior changes without policy version bump reduce auditability → **Mitigation:** update `POLICY_VERSION` in the same change and reference it in tests/docs.

## Migration Plan

1. Add coverage band constants and policy version update in `apps/api/src/constants.ts`.
2. Refactor `evaluateRelease` to compute coverage baseline and apply blocker overrides while preserving reason ordering.
3. Ensure `GET /api/v1/policy` reports the effective thresholds from constants.
4. Recalculate seed-derived expected aggregates and update affected tests/scripts.
5. Update policy documentation to match implemented behavior.
6. Validate with `npm run validate` and `npm run simulate:pipeline -- <cenário>`.

## Open Questions

- Nenhuma no âmbito desta proposta: a regra de decisão por cobertura foi fixada como `NO_GO < 70`, `REVIEW >= 70 && < 80`, `GO >= 80`.
