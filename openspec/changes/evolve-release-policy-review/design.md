## Context

See `proposal.md` for motivation and scope intent. This design focuses on how to implement the change while preserving project constraints:

- `POST /api/v1/evaluations` request/response shape is frozen.
- `packages/contracts` remains the source of truth for shared enums and schemas.
- Decision logic stays centralized in `apps/api/src/services/releaseService.ts`.
- Dashboard and simulator are observers and are out of implementation scope.

Current implementation gaps relevant to this change:

- The engine hardcodes coverage comparison with `< 70` instead of using `MINIMUM_COVERAGE`.
- The engine never emits `REVIEW`.
- `HIGH_SECURITY_RISK` is not present in `REASON_CODES` and is never emitted.
- `topBlockingReasons` currently counts reasons for any decision different from `GO`, which will misclassify review-only reasons as blocking.

## Goals / Non-Goals

**Goals:**

- Implement policy semantics that can return `GO`, `REVIEW`, or `NO_GO` with precedence `NO_GO > REVIEW > GO`.
- Emit `HIGH_SECURITY_RISK` only for `security.high > 0` with `security.critical = 0`.
- Enforce canonical reason ordering with `HIGH_SECURITY_RISK` inserted before `LINT_ERRORS`.
- Remove policy numeric literals from decision logic by using `MINIMUM_COVERAGE`.
- Ensure statistics treat only `NO_GO` reasons as blocking.

**Non-Goals:**

- Do not change API schemas or endpoint shapes.
- Do not change dashboard or simulator code.
- Do not change the numeric value of `MINIMUM_COVERAGE`.
- Do not address unrelated routing/test debt outside policy semantics.

## Decisions

### 1) Keep policy orchestration in `releaseService.ts`

- Decision: implement all new rule evaluation in `apps/api/src/services/releaseService.ts`.
- Rationale: aligns with the architecture guardrail in `AGENTS.md` (single decision engine location) and minimizes cross-module complexity.
- Alternative considered: distribute rule checks across route/repository layers; rejected because it fragments policy semantics and complicates auditability.

### 2) Use reason collection plus precedence mapping

- Decision: keep collecting reasons first, then derive final decision with explicit precedence.
- Rationale: preserves existing shape (`reasons: string[]`), keeps reason audit trail stable, and makes precedence transparent.
- Alternative considered: short-circuit evaluation on first blocking rule; rejected because it would lose multi-reason audit output expected by the system.

### 3) Enforce high-risk mutual exclusion with critical risk

- Decision: emit `HIGH_SECURITY_RISK` only when `security.high > 0` and `security.critical = 0`.
- Rationale: matches requested policy rule and prevents impossible expectation where both `CRITICAL_SECURITY_VULNERABILITY` and `HIGH_SECURITY_RISK` appear together.
- Alternative considered: always emit `HIGH_SECURITY_RISK` whenever `high > 0`; rejected because it conflicts with the accepted rule and muddies reason semantics under blocking critical findings.

### 4) Canonical reason order is push order and contract order

- Decision: align push order in the engine and `REASON_CODES` order in contracts to the same canonical sequence.
- Rationale: keeps deterministic output order without introducing extra sorting logic and keeps shared source (`packages/contracts`) aligned with runtime.
- Alternative considered: sort reasons post hoc with a rank table; rejected as unnecessary complexity for fixed rule count.

### 5) Restrict top blocking reason aggregation to `NO_GO`

- Decision: change statistics filter from `decision !== 'GO'` to `decision === 'NO_GO'`.
- Rationale: keeps the meaning of `topBlockingReasons` correct after introducing `REVIEW`.
- Alternative considered: rename field semantics to include review reasons; rejected due to unnecessary outward semantic change.

### 6) Validate behavior with boundary-driven tests

- Decision: prioritize boundary test scenarios that prove precedence, mutual exclusion, and exact reason arrays for blocking and review cases.
- Rationale: user acceptance criteria are boundary-focused and these cases are where regressions are likely.
- Alternative considered: rely only on existing healthy-path tests; rejected because current suite does not catch key policy drifts.

## Risks / Trade-offs

- [Risk] Existing test expectations anchored to old seeded statistics fail after policy change.
  - Mitigation: record failing assertions and classify them as old-policy encoding before updating tests with explicit human sign-off.

- [Risk] Future constant edits could again drift from behavior if tests are weak.
  - Mitigation: add explicit boundary assertions at `MINIMUM_COVERAGE` and below-threshold inputs.

- [Risk] Review reasons could still leak into blocking reports if route logic is not changed with engine logic.
  - Mitigation: include route-level assertion that `topBlockingReasons` only comes from `NO_GO` rows.

## Migration Plan

1. Update contract reason constants and decision engine semantics in the same branch.
2. Update statistics aggregation filter to `NO_GO` only.
3. Update and extend tests for boundary and precedence coverage.
4. Run `npm run validate` and verify seed-level statistics on fresh boot.
5. Merge after review with explicit note that seeded history is re-evaluated at startup by design.

Rollback strategy:

- Revert the change set if unexpected downstream behavior appears; no data migration is required because persistence is in-memory and recomputed on startup.

## Open Questions

- Business confirmation of long-term coverage threshold target (`70` vs `75`) remains outside this change and does not alter this implementation approach.
