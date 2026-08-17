## 1. Policy Engine and Contracts

- [ ] 1.1 Extend reason codes in `packages/contracts/src/index.ts` with `HIGH_SECURITY_RISK` and `COVERAGE_REQUIRES_REVIEW` in canonical order.
- [ ] 1.2 Update coverage policy constants for explicit bands (`<60` blocking, `60..79` review).
- [ ] 1.3 Update `apps/api/src/services/releaseService.ts` to emit `GO | REVIEW | NO_GO` using blocking-vs-review precedence.
- [ ] 1.4 Implement review rules: `security.high > 0` with `security.critical == 0`, and coverage `60..79`, both producing `REVIEW`.
- [ ] 1.5 Keep blocking rules unchanged (`coverage < 60`, failed tests, critical vulns, lint) and ensure they override review reasons when both apply.

## 2. Backend Behavior Verification

- [ ] 2.1 Update `apps/api/test/policy.test.ts` with review scenarios (high-only => REVIEW, coverage 60/79 => REVIEW) and canonical reason ordering.
- [ ] 2.2 Add boundary tests for coverage values 59, 60, 79, and 80.
- [ ] 2.3 Update `apps/api/test/api.test.ts` with API-level coverage for REVIEW decision paths from security and coverage rules.
- [ ] 2.4 Recalculate and update seed statistics expectations (`byDecision`) after policy re-evaluation.

## 3. Documentation Synchronization

- [ ] 3.1 Update `docs/release-policy.md` to include REVIEW semantics and reasons (`HIGH_SECURITY_RISK`, `COVERAGE_REQUIRES_REVIEW`).
- [ ] 3.2 Document coverage bands explicitly: `<60` => NO_GO, `60..79` => REVIEW, `>=80` => no coverage restriction.
- [ ] 3.3 Update any decision descriptions in `README.md` and `docs/architecture.md` so docs match executable behavior.

## 4. End-to-End Validation

- [ ] 4.1 Run `npm test` and ensure all API policy tests pass with the new REVIEW behavior.
- [ ] 4.2 Run `npm run validate` and confirm all layers pass (typecheck, lint, tests, coverage, smoke).
- [ ] 4.3 Manually smoke-check dashboard/simulator (`npm run dev`, `npm run simulate:pipeline -- <cenario>`) to confirm REVIEW is visible and coherent.
