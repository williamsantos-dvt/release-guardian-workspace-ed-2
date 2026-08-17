## 1. Policy Engine and Contracts

- [x] 1.1 Extend reason codes in `packages/contracts/src/index.ts` with `HIGH_SECURITY_RISK` and `COVERAGE_REQUIRES_REVIEW` in canonical order.
- [x] 1.2 Update coverage policy constants for explicit bands (`<60` blocking, `60..79` review).
- [x] 1.3 Update `apps/api/src/services/releaseService.ts` to emit `GO | REVIEW | NO_GO` using blocking-vs-review precedence.
- [x] 1.4 Implement review rules: `security.high > 0` with `security.critical == 0`, and coverage `60..79`, both producing `REVIEW`.
- [x] 1.5 Keep blocking rules unchanged (`coverage < 60`, failed tests, critical vulns, lint) and ensure they override review reasons when both apply.

## 2. Backend Behavior Verification

- [x] 2.1 Update `apps/api/test/policy.test.ts` with review scenarios (high-only => REVIEW, coverage 60/79 => REVIEW) and canonical reason ordering.
- [x] 2.2 Add boundary tests for coverage values 59, 60, 79, and 80.
- [x] 2.3 Update `apps/api/test/api.test.ts` with API-level coverage for REVIEW decision paths from security and coverage rules.
- [x] 2.4 Recalculate and update seed statistics expectations (`byDecision`) after policy re-evaluation.

## 3. Documentation Synchronization

- [x] 3.1 Update `docs/release-policy.md` to include REVIEW semantics and reasons (`HIGH_SECURITY_RISK`, `COVERAGE_REQUIRES_REVIEW`).
- [x] 3.2 Document coverage bands explicitly: `<60` => NO_GO, `60..79` => REVIEW, `>=80` => no coverage restriction.
- [x] 3.3 Update any decision descriptions in `README.md` and `docs/architecture.md` so docs match executable behavior.

## 4. End-to-End Validation

- [x] 4.1 Run `npm test` and ensure all API policy tests pass with the new REVIEW behavior.
- [x] 4.2 Run `npm run validate` and confirm all layers pass (typecheck, lint, tests, coverage, smoke).
- [x] 4.3 Manually smoke-check dashboard/simulator (`npm run dev`, `npm run simulate:pipeline -- <cenario>`) to confirm REVIEW is visible and coherent.

## 5. CR-01 Hotfix Policy Adaptation (pending)

Note: this section supersedes prior uniform coverage thresholds and updates
review/blocking rules according to `docs/change-requests/cr-01-hotfix-policy.md`.

- [x] 5.1 Update coverage constants for release-type-specific thresholds: standard (`<70` no-go, `70..79.99` review) and hotfix (`<65` no-go, `65..79.99` review).
- [x] 5.2 Update `apps/api/src/services/releaseService.ts` to apply coverage bands by `releaseType` while keeping precedence `NO_GO > REVIEW > GO`.
- [x] 5.3 Update high-security rule to emit `HIGH_SECURITY_RISK` only when `security.high >= 3` and `security.critical == 0`.
- [x] 5.4 Reclassify `LINT_ERRORS` as review-level (`REVIEW`) and ensure it is not part of blocking reasons.
- [x] 5.5 Keep no-go rules unchanged for mandatory test failures and critical vulnerabilities.
- [x] 5.6 Update `apps/api/test/policy.test.ts` with CR-01 threshold cases, including `standard` 67 => `NO_GO` and `hotfix` 67 => `REVIEW`.
- [x] 5.7 Update `apps/api/test/api.test.ts` for release-type coverage behavior, high-threshold (`>=3`), lint review behavior, and refreshed seed stats.
- [x] 5.8 Update `docs/release-policy.md`, `docs/architecture.md`, and `README.md` to document CR-01 thresholds and unchanged constraints.
- [x] 5.9 Run `npm test` and `npm run validate` and confirm both pass under CR-01 behavior.
