## 1. Policy Engine and Constants

- [ ] 1.1 Bump policy constants to `POLICY_VERSION = 1.3.0`, `MINIMUM_COVERAGE = 60`, and add `GO_COVERAGE = 80`
- [ ] 1.2 Update `evaluateRelease` to generate coverage reasons for both review and block bands
- [ ] 1.3 Resolve final decision by precedence (`NO_GO` > `REVIEW` > `GO`) without changing API payload shape

## 2. Shared Contracts and Reason Taxonomy

- [ ] 2.1 Add `COVERAGE_REQUIRES_REVIEW` to shared `REASON_CODES` in canonical order
- [ ] 2.2 Keep decision contract values unchanged (`GO|REVIEW|NO_GO`) and ensure runtime now emits `REVIEW`

## 3. Documentation Alignment

- [ ] 3.1 Update `docs/release-policy.md` with policy `1.3.0` decision table and coverage bands
- [ ] 3.2 Document that `security.high` does not trigger `REVIEW` in 1.3.0
- [ ] 3.3 Update reason ordering to include `COVERAGE_REQUIRES_REVIEW`

## 4. Automated Verification

- [ ] 4.1 Update policy unit tests for coverage thresholds: `55 -> NO_GO`, `72 -> REVIEW`, `85 -> GO`
- [ ] 4.2 Add/adjust API tests for `GET /api/v1/policy` (`1.3.0`, minimum coverage `60`)
- [ ] 4.3 Add API evaluation test for coverage-band `REVIEW` with reason `COVERAGE_REQUIRES_REVIEW`
- [ ] 4.4 Update seeded statistics expectation to `GO: 10`, `REVIEW: 5`, `NO_GO: 3`

## 5. End-to-End Validation

- [ ] 5.1 Run targeted tests for policy and API suites
- [ ] 5.2 Run full `npm run validate` and confirm all stages pass
- [ ] 5.3 Perform manual smoke check via simulator/dashboard for a coverage-based `REVIEW` decision
