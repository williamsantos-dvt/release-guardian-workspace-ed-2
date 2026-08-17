## 1. Policy engine updates

- [x] 1.1 Implement release-type-aware coverage thresholds in `evaluateRelease` (`standard`: block <70/review <80, `hotfix`: block <65/review <80)
- [x] 1.2 Preserve deterministic precedence (`NO_GO > REVIEW > GO`) and canonical reason ordering while adding coverage review-band handling
- [x] 1.3 Keep non-coverage rule semantics intact (failed tests and critical vulnerabilities block; high >=3 and lint errors trigger review when no blocker exists)

## 2. Contracts and constants alignment

- [x] 2.1 Update policy constants and any helper structures needed for threshold maps keyed by release type
- [x] 2.2 Ensure shared reason-code definitions remain consistent with emitted reasons and CR-01 semantics

## 3. Tests and seeded behavior validation

- [x] 3.1 Update `apps/api/test/policy.test.ts` to cover standard and hotfix coverage bands plus unchanged risk-rule behavior
- [x] 3.2 Update `apps/api/test/api.test.ts` to validate policy snapshot and seeded statistics under CR-01 behavior
- [x] 3.3 Add/adjust assertions for canonical acceptance case: `hotfix-release` at coverage 67 evaluates `REVIEW`, while equivalent `standard` evidence evaluates `NO_GO`

## 4. Documentation and scenario verification

- [x] 4.1 Update `docs/release-policy.md` to document CR-01 coverage tables by release type and unchanged precedence/risk rules
- [x] 4.2 Update `docs/architecture.md` to reflect release-type-aware policy behavior and expected simulator outcomes
- [x] 4.3 Verify simulator scenarios (`healthy-release`, `low-coverage`, `hotfix-release`) align with the updated policy decisions

## 5. Final validation

- [x] 5.1 Run focused policy/API tests to confirm decision logic and ordering
- [x] 5.2 Run `npm run validate` and resolve any regressions before apply completion
