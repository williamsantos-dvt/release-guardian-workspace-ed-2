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
