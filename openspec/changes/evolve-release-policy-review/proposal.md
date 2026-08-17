## Why

The current policy engine does not emit `REVIEW` and ignores `HIGH_SECURITY_RISK`, even though those semantics are already represented in the public contract and in organizational policy documentation. This creates drift between runtime behavior, contracts, and policy intent, and it also causes statistics to misrepresent review-only outcomes.

## What Changes

- Evolve release decision rules to support `NO_GO`, `REVIEW`, and `GO` with precedence `NO_GO > REVIEW > GO`.
- Add support for `HIGH_SECURITY_RISK` as a review reason when `security.high > 0` and `security.critical = 0`.
- Keep all blocking rules in place (`coverage`, mandatory test failures, critical vulnerabilities, lint errors).
- Extend canonical reason ordering to include `HIGH_SECURITY_RISK`.
- Remove policy literals from the decision engine by using `MINIMUM_COVERAGE` as the threshold source.
- Fix `/api/v1/statistics` so `topBlockingReasons` counts only reasons from `NO_GO` decisions, not all non-`GO` decisions.

## Capabilities

### New Capabilities
- `release-policy`: Defines decision semantics and reason semantics for `NO_GO`, `REVIEW`, and `GO`, including canonical reason order and statistics interpretation for blocking reasons.

### Modified Capabilities
- None.

## Impact

- Affected implementation areas:
  - `apps/api/src/services/releaseService.ts`
  - `apps/api/src/routes/index.ts`
  - `packages/contracts/src/index.ts` (`REASON_CODES` only)
- Frozen HTTP contract remains unchanged for `POST /api/v1/evaluations`; only values become more expressive (`REVIEW`, `HIGH_SECURITY_RISK`) within existing schema allowances.
- Seeded statistics are expected to change from `GO 13 / REVIEW 0 / NO_GO 5` to `GO 8 / REVIEW 5 / NO_GO 5` due to startup re-evaluation behavior.
- One existing API test is expected to fail legitimately until assertions are updated with human approval (`apps/api/test/api.test.ts:103`).

## Acceptance Criteria

- Decision precedence is strictly `NO_GO > REVIEW > GO`.
- Coverage rule uses `MINIMUM_COVERAGE` from constants; no numeric policy literal remains in the decision engine.
- Canonical reason order is: `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `HIGH_SECURITY_RISK`, `LINT_ERRORS`.
- Blocking case: `coverage < minimum`, `tests.failed > 0`, `critical > 0`, `lintErrors > 0` returns `NO_GO` with exactly `['COVERAGE_BELOW_MINIMUM','MANDATORY_TEST_FAILURE','CRITICAL_SECURITY_VULNERABILITY','LINT_ERRORS']`.
- Review case: `high > 0`, `critical = 0` returns `REVIEW` with exactly `['HIGH_SECURITY_RISK']`.
- Mutual exclusion case: `critical > 0` and `high > 0` returns `NO_GO`, and `reasons` does not contain `HIGH_SECURITY_RISK`.
- `GET /api/v1/statistics` counts `topBlockingReasons` only from `NO_GO` evaluations.

## Non-goals

- Do not change the numeric value of coverage threshold in this change; keep the current runtime value (`70`) and treat `70 vs 75` as a business decision outside this scope.
- Do not change the HTTP request/response shapes or JSON Schemas for `POST /api/v1/evaluations`.
- Do not modify `apps/dashboard/` or `scripts/`.
- Do not address unrelated known issues (for example pagination off-by-one or broader type-safety refactors).
