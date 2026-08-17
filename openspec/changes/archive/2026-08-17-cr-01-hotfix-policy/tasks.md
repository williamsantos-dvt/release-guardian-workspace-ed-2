## 1. Update policy thresholds and reason taxonomy

- [x] 1.1 Update `apps/api/src/constants.ts` to `STANDARD_REVIEW_MIN=70`, `STANDARD_GO_MIN=80`, `HOTFIX_REVIEW_MIN=65`, `HOTFIX_GO_MIN=80`, and keep `MINIMUM_COVERAGE=70`.
- [x] 1.2 Keep reason code catalog stable in `packages/contracts/src/index.ts` and confirm it still includes `HIGH_SECURITY_RISK` and `LINT_ERRORS`.
- [x] 1.3 Ensure `/api/v1/policy` output remains stable while reflecting the new `minimumCoverage` semantic minimum.

## 2. Implement CR-01 decision semantics in policy engine

- [x] 2.1 Refactor `evaluateRelease` in `apps/api/src/services/releaseService.ts` to enforce precedence `NO_GO > REVIEW > GO`.
- [x] 2.2 Keep `tests.failed > 0` and `security.critical > 0` as hard `NO_GO` blockers with mapped reason codes.
- [x] 2.3 Implement review-level signals: `security.high >= 3` -> `HIGH_SECURITY_RISK`, `lintErrors > 0` -> `LINT_ERRORS`.
- [x] 2.4 Apply coverage bands by release type: `standard` (`<70` NO_GO, `70-79.99` REVIEW, `>=80` unrestricted) and `hotfix` (`<65` NO_GO, `65-79.99` REVIEW, `>=80` unrestricted).
- [x] 2.5 Return all applicable reasons in canonical order for both `NO_GO` and `REVIEW` outcomes.

## 3. Update automated tests for CR-01 behavior

- [x] 3.1 Update `apps/api/test/policy.test.ts` for new standard and hotfix thresholds.
- [x] 3.2 Add policy tests proving `security.high >= 3` produces `REVIEW`, while `security.high < 3` does not trigger that reason by itself.
- [x] 3.3 Add policy tests proving `lintErrors > 0` produces `REVIEW` when no hard blocker exists.
- [x] 3.4 Add precedence tests showing hard blockers override review-level signals.
- [x] 3.5 Update `apps/api/test/api.test.ts` for `/api/v1/policy.minimumCoverage = 70` and revised decision/statistics expectations.
- [x] 3.6 Validate CR-01 acceptance path in tests: hotfix with coverage 67 and healthy remaining signals returns `REVIEW`.

## 4. Documentation and verification

- [x] 4.1 Update `docs/release-policy.md` to match CR-01 thresholds and rule classification (`high>=3` and `lint` as REVIEW-level).
- [x] 4.2 Keep `docs/change-requests/cr-01-hotfix-policy.md` alignment explicit in wording and examples.
- [x] 4.3 Run focused checks: `npm test -- apps/api/test/policy.test.ts apps/api/test/api.test.ts`.
- [x] 4.4 Run full project validation: `npm run validate`.
