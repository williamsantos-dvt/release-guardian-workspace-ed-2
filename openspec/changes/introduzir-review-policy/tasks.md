## 1. Contracts and policy constants

- [ ] 1.1 Add `HIGH_SECURITY_RISK` to `REASON_CODES` in `packages/contracts/src/index.ts` in canonical order.
- [ ] 1.2 Add coverage threshold constants in `apps/api/src/constants.ts`: `STANDARD_REVIEW_MIN=70`, `STANDARD_GO_MIN=75`, `HOTFIX_REVIEW_MIN=75`, `HOTFIX_GO_MIN=80`.
- [ ] 1.3 Keep `MINIMUM_COVERAGE` aligned to `STANDARD_GO_MIN` and bump `POLICY_VERSION` for policy change visibility.

## 2. Policy engine behavior

- [ ] 2.1 Update `DecisionResult` in `apps/api/src/services/releaseService.ts` to emit `GO | REVIEW | NO_GO`.
- [ ] 2.2 Implement hard-blocker precedence in `evaluateRelease`: fail on `tests.failed`, `security.critical`, `security.high`, `lintErrors` with mapped reason codes.
- [ ] 2.3 Implement coverage-band evaluation by `releaseType` when no hard blockers exist (`standard` 70/75, `hotfix` 75/80).
- [ ] 2.4 Enforce reason semantics: `REVIEW` and coverage-only `NO_GO` return only `COVERAGE_BELOW_MINIMUM`.
- [ ] 2.5 Enforce canonical reason ordering: `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `HIGH_SECURITY_RISK`, `LINT_ERRORS`.

## 3. Tests and API-facing behavior

- [ ] 3.1 Extend `apps/api/test/policy.test.ts` with `REVIEW` scenarios for `standard` and `hotfix` coverage bands.
- [ ] 3.2 Add policy tests proving hard-blocker precedence over high coverage, including `security.high > 0` -> `NO_GO` with `HIGH_SECURITY_RISK`.
- [ ] 3.3 Add policy tests for canonical reason ordering under combined failures.
- [ ] 3.4 Extend `apps/api/test/api.test.ts` with `POST /api/v1/evaluations` case that returns `REVIEW` for moderate low coverage without blockers.
- [ ] 3.5 Update `GET /api/v1/statistics` expectations in `apps/api/test/api.test.ts` to include non-zero `REVIEW` when applicable and `HIGH_SECURITY_RISK` in top reasons when present.

## 4. Documentation and verification

- [ ] 4.1 Update `docs/release-policy.md` to document `REVIEW`, hard-blocking `security.high`, and per-type thresholds.
- [ ] 4.2 Confirm `/api/v1/policy` still returns stable shape and `minimumCoverage` reflects standard GO baseline.
- [ ] 4.3 Run focused tests: `npm test -- apps/api/test/policy.test.ts` and `npm test -- apps/api/test/api.test.ts`.
- [ ] 4.4 Run full validation: `npm run validate`.
- [ ] 4.5 Verify no HTTP contract shape changes in request/response schemas in `packages/contracts/src/index.ts`.
