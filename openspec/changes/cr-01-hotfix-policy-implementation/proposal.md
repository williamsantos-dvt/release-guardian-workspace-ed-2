## Why

CR-01 introduced an emergency requirement: hotfix releases need faster paths to production while standard releases keep stricter quality gates. The current policy treats both release types the same for coverage, causing unnecessary hotfix blocking and diverging from the newly published change-request rules.

## What Changes

- Introduce release-type-specific coverage thresholds in the policy engine.
- Keep standard coverage policy as defined by CR-01 (`<70` NO_GO, `70-79.99` REVIEW, `>=80` no coverage restriction).
- Add hotfix coverage policy per CR-01 (`<65` NO_GO, `65-79.99` REVIEW, `>=80` no coverage restriction).
- Preserve existing precedence and safety rules (`NO_GO > REVIEW > GO`) for tests, critical vulnerabilities, high vulnerabilities, and lint.
- Align tests, seeded-history expectations, and docs with the CR-01 behavior, including the canonical `hotfix-release` scenario.

## Capabilities

### New Capabilities
- `release-policy`: release-readiness policy supports type-aware coverage thresholds while preserving existing risk precedence and reason ordering.

### Modified Capabilities
- None.

## Impact

- Affected code: `apps/api/src/services/releaseService.ts`, `apps/api/src/constants.ts`.
- Affected tests: `apps/api/test/policy.test.ts`, `apps/api/test/api.test.ts` and seed-driven statistics expectations.
- Affected docs: `docs/release-policy.md`, `docs/architecture.md`, and alignment with `docs/change-requests/cr-01-hotfix-policy.md`.
- Affected runtime behavior: `POST /api/v1/evaluations`, `GET /api/v1/statistics`, and simulator outcome for `hotfix-release`.
- Contract boundary unchanged: no request/response shape changes and no new endpoints.
