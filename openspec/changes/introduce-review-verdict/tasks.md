## 1. Policy Semantics

- [x] 1.1 Add explicit reason-tier classification (`blocking` vs `review`) and decision precedence (`NO_GO > REVIEW > GO`) in the policy evaluation flow.
- [x] 1.2 Introduce `HIGH_SECURITY_RISK` as a review-tier reason and ensure mixed blocking/review evidence resolves to `NO_GO`.
- [x] 1.3 Centralize canonical reason ordering so all applicable reasons are emitted once and in deterministic order.

## 2. Contract-Adjacent API Consistency

- [x] 2.1 Ensure evaluation responses can return `REVIEW` without changing request/response shape for `POST /api/v1/evaluations`.
- [x] 2.2 Ensure seeded evaluations and persistence/re-evaluation paths preserve tri-state decisions and reason reporting.
- [x] 2.3 Ensure `GET /api/v1/statistics` reflects `REVIEW` counts and remains consistent with evaluation outcomes.

## 3. Consumer and Scenario Alignment

- [x] 3.1 Update simulator examples and simulator expectations to include at least one `REVIEW` scenario and preserve existing `GO`/`NO_GO` flows.
- [x] 3.2 Align policy documentation with the implemented tier model (decision set, review triggers, reason ordering, threshold values).
- [x] 3.3 Verify dashboard-observable behavior remains coherent with tri-state decisions and policy snapshot output.

## 4. Verification Matrix

- [x] 4.1 Expand policy unit tests for all verdict paths: GO-only, REVIEW-only, NO_GO-only, and mixed precedence cases.
- [x] 4.2 Expand API tests for tri-state decisions, reason payloads, and statistics aggregation including `byDecision.REVIEW`.
- [x] 4.3 Run `npm test`, `npm run coverage`, and `npm run validate`, then capture key evidence that `GO`, `REVIEW`, and `NO_GO` are all validated.

## 5. CR-01 Hotfix Coverage Policy

- [x] 5.1 Implement release-type-specific coverage bands in the policy engine for `standard` and `hotfix` (per CR-01 tables).
- [x] 5.2 Update policy unit tests to cover standard/hotfix coverage bands and the CR-01 acceptance scenario for `hotfix-release`.
- [x] 5.3 Update API tests and statistics expectations to reflect tri-state decisions with release-type coverage bands (`byDecision` counts and seeded evaluations).
- [x] 5.4 Align any remaining docs/examples with CR-01 (ensure `hotfix-release` at 67% evaluates as `REVIEW` and standard at 67% remains `NO_GO`).
