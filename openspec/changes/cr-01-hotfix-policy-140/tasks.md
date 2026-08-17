## 1. Policy 1.4.0 Core

- [x] 1.1 Set `POLICY_VERSION` to `1.4.0`
- [x] 1.2 Implement coverage thresholds by release type (`standard`: 70, `hotfix`: 65, GO at 80)
- [x] 1.3 Keep final decision precedence `NO_GO > REVIEW > GO`

## 2. Reason Taxonomy and Decision Semantics

- [x] 2.1 Reintroduce `HIGH_SECURITY_RISK` for `security.high >= 3` (without critical)
- [x] 2.2 Reclassify `LINT_ERRORS` to review-level (no longer blocking by itself)
- [x] 2.3 Preserve canonical reason ordering in responses and shared contracts

## 3. Documentation Alignment

- [x] 3.1 Update `docs/release-policy.md` to describe `standard` and `hotfix` coverage tables
- [x] 3.2 Document `/api/v1/policy` semantics with `minimumCoverage = 65`
- [x] 3.3 Keep explicit statement that HTTP contract shape is unchanged

## 4. Automated Verification

- [x] 4.1 Update unit policy tests for `standard` vs `hotfix` coverage outcomes
- [x] 4.2 Add tests for `HIGH_SECURITY_RISK` review behavior (`high >= 3`)
- [x] 4.3 Update lint behavior tests to expect `REVIEW`
- [x] 4.4 Update API tests for policy snapshot (`1.4.0`, `minimumCoverage: 65`) and seed statistics

## 5. Acceptance and Validation

- [x] 5.1 Verify CR-01 acceptance with `npm run simulate:pipeline -- hotfix-release` (`REVIEW`)
- [x] 5.2 Run targeted policy/API tests
- [x] 5.3 Run full `npm run validate`

Validation evidence:
- `npm test -- apps/api/test/policy.test.ts apps/api/test/api.test.ts` passed (23 tests).
- `npm run validate` passed (typecheck, lint, tests, coverage, smoke funcional).
- `npm run simulate:pipeline -- hotfix-release` returned `REVIEW` with `COVERAGE_REQUIRES_REVIEW` on policy `1.4.0`.
