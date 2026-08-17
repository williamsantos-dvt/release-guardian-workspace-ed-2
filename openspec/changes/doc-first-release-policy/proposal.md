## Why

The implemented release policy is out of sync with project documentation and the public decision contract. The code currently uses coverage >= 70 and never emits `REVIEW`, while docs require coverage >= 75 and describe review-based handling for high security risk.

This mismatch causes confusion for pipeline users, weakens trust in docs, and prevents the dashboard/simulator from reflecting the intended `GO`/`REVIEW`/`NO_GO` policy behavior.

## What Changes

- Align minimum coverage with docs: coverage below 75 blocks releases with `COVERAGE_BELOW_MINIMUM`.
- Introduce explicit review handling for security high vulnerabilities: when `critical === 0` and `high > 0`, emit `REVIEW` with `HIGH_SECURITY_RISK`.
- Keep existing hard blockers for failed tests, critical vulnerabilities, and lint errors.
- Update seeded history expectations, API/policy tests, and documentation so behavior is consistent across implementation, tests, and docs.

## Capabilities

### New Capabilities
- `release-policy`: policy now emits full `GO`/`REVIEW`/`NO_GO` decisions with documented coverage and security-review semantics.

### Modified Capabilities
- None.

## Impact

- Affected code: `apps/api/src/services/releaseService.ts`, `apps/api/src/constants.ts`, `apps/api/src/seeds/seedData.ts`.
- Affected contract: `packages/contracts/src/index.ts` reason codes (add `HIGH_SECURITY_RISK`) while keeping request/response shapes frozen.
- Affected tests: `apps/api/test/policy.test.ts`, `apps/api/test/api.test.ts`.
- Affected docs: `docs/release-policy.md`, `docs/architecture.md`.
- Affected runtime outputs: `/api/v1/statistics`, dashboard counters, and simulator output for review cases.
