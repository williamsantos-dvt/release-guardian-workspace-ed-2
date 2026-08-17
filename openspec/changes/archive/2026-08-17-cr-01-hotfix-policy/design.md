## Context

Current policy implementation (from the prior change) treats `security.high > 0` and `lintErrors > 0` as hard `NO_GO` blockers and uses stricter coverage thresholds (`standard` GO at 75, `hotfix` REVIEW floor at 75).
CR-01 requires a different operating model for incident hotfixes: hotfix coverage review starts at 65, and `security.high`/`lintErrors` become review-level signals instead of hard blockers.
See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Align policy behavior with CR-01 thresholds (`standard` 70/80, `hotfix` 65/80).
- Keep hard blockers limited to mandatory test failures and critical vulnerabilities.
- Classify `security.high >= 3` and `lintErrors > 0` as `REVIEW` signals.
- Preserve reason ordering and frozen HTTP shapes.
- Keep `GET /api/v1/policy.minimumCoverage = 70`.

**Non-Goals:**
- No endpoint additions or schema shape changes.
- No persistence, dashboard, or simulator structural changes.
- No refactor outside policy logic, constants, tests, and policy docs.

## Decisions

### Decision 1: Three-stage policy evaluation with explicit severity tiers
Use staged evaluation in `evaluateRelease`:
1. Hard blockers (`tests.failed > 0`, `security.critical > 0`) determine `NO_GO`.
2. Review-level signals (`security.high >= 3`, `lintErrors > 0`, coverage in review band) determine `REVIEW` when no hard blocker exists.
3. Otherwise, return `GO`.

Rationale: Implements CR-01 precedence directly (`NO_GO > REVIEW > GO`) while preserving deterministic behavior.

Alternative considered: Continue reason-accumulation-only and infer final decision late.
Rejected: harder to verify tier transitions and easier to regress precedence.

### Decision 2: Threshold constants are updated in place
Set coverage constants to:
- `STANDARD_REVIEW_MIN = 70`
- `STANDARD_GO_MIN = 80`
- `HOTFIX_REVIEW_MIN = 65`
- `HOTFIX_GO_MIN = 80`
and keep `MINIMUM_COVERAGE = 70`.

Rationale: centralizes policy tuning and keeps `/api/v1/policy` aligned with agreed semantic minimum.

Alternative considered: introducing separate constants only for `/policy` endpoint.
Rejected: duplicates policy truth and risks drift.

### Decision 3: Reason semantics become multi-cause in REVIEW outcomes
`REVIEW` may include one or more reasons among:
- `COVERAGE_BELOW_MINIMUM` (review bands only)
- `HIGH_SECURITY_RISK` (`security.high >= 3`)
- `LINT_ERRORS` (`lintErrors > 0`)

Rationale: matches CR-01 “all applicable reasons” while retaining auditable reason details.

Alternative considered: keep REVIEW with only coverage reason.
Rejected: loses explicit risk/lint evidence required by CR-01 semantics.

### Decision 4: Canonical reason order remains unchanged
Keep canonical order unchanged to avoid consumer churn and preserve deterministic tests.

Rationale: compatibility and stable output across policy revisions.

Alternative considered: reorder reasons by severity tiers.
Rejected: unnecessary API behavior change for current scope.

## Risks / Trade-offs

- [Higher REVIEW volume due to lint/high signals] -> Keep precedence explicit and validate statistics expectations in API tests.
- [Ambiguity for `security.high` values 1-2] -> Enforce CR-01 literal threshold: only `>= 3` emits `HIGH_SECURITY_RISK` and influences decision.
- [Drift between CR document and policy docs] -> Update `docs/release-policy.md` in same change and verify via focused + full validation.

## Migration Plan

1. Update constants and reason classification logic in policy service.
2. Update policy unit tests for threshold bands, high/lint review behavior, and precedence.
3. Update API tests for `/policy`, `POST /evaluations` review path, and `/statistics` expectations.
4. Update `docs/release-policy.md` to match CR-01 semantics.
5. Run `npm test -- apps/api/test/policy.test.ts apps/api/test/api.test.ts`.
6. Run `npm run validate`.

Rollback strategy:
- Revert this change to restore prior stricter policy behavior without HTTP contract break.

## Open Questions

- None.
