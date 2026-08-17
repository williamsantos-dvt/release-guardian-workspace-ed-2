## 1. Policy engine updates

- [ ] 1.1 Update `apps/api/src/services/releaseService.ts` to evaluate coverage against `MINIMUM_COVERAGE` and remove any numeric policy literal from decision logic.
- [ ] 1.2 Extend engine decision derivation to return `GO`, `REVIEW`, or `NO_GO` with explicit precedence `NO_GO > REVIEW > GO`.
- [ ] 1.3 Add `HIGH_SECURITY_RISK` emission only when `security.high > 0` and `security.critical = 0`.
- [ ] 1.4 Keep reason emission order canonical: `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `HIGH_SECURITY_RISK`, `LINT_ERRORS`.

## 2. Contracts and statistics alignment

- [ ] 2.1 Update `packages/contracts/src/index.ts` so `REASON_CODES` includes `HIGH_SECURITY_RISK` in canonical position.
- [ ] 2.2 Update `apps/api/src/routes/index.ts` statistics aggregation so `topBlockingReasons` counts only reasons from evaluations with `decision === 'NO_GO'`.
- [ ] 2.3 Confirm no HTTP schema shape changes are introduced for `POST /api/v1/evaluations`.

## 3. Test updates for acceptance criteria

- [ ] 3.1 Add/adjust engine tests for blocking case: `coverage < minimum`, `tests.failed > 0`, `critical > 0`, `lintErrors > 0` returns `NO_GO` with exactly `['COVERAGE_BELOW_MINIMUM','MANDATORY_TEST_FAILURE','CRITICAL_SECURITY_VULNERABILITY','LINT_ERRORS']`.
- [ ] 3.2 Add/adjust engine tests for review case: `high > 0`, `critical = 0` returns `REVIEW` with exactly `['HIGH_SECURITY_RISK']`.
- [ ] 3.3 Add/adjust engine tests for mutual exclusion: `critical > 0` and `high > 0` returns `NO_GO` and reasons do not include `HIGH_SECURITY_RISK`.
- [ ] 3.4 Update API statistics expectation for seeded history to `byDecision = { GO: 8, REVIEW: 5, NO_GO: 5 }` after classifying this assertion as old-policy behavior and recording the justification.
- [ ] 3.5 Add/adjust API statistics assertions to confirm review evaluations do not contribute to `topBlockingReasons`.

## 4. Validation and rollout checks

- [ ] 4.1 Run `npm test` and ensure policy and API suites pass with new semantics.
- [ ] 4.2 Run `npm run validate` and confirm all validation layers pass.
- [ ] 4.3 Verify expected seed impact via runtime check: the five documented releases move from `GO` to `REVIEW`, giving `GO 8 / REVIEW 5 / NO_GO 5`.
- [ ] 4.4 Document changed tests with old value, new value, and classification per `AGENTS.md` test-governance rule.
