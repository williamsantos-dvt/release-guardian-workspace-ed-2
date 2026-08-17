## Why

The original scope introduced `REVIEW`, but CR-01 (`docs/change-requests/cr-01-hotfix-policy.md`)
changes policy behavior for coverage by release type and tightens/clarifies some review
rules. The change artifacts must be updated so implementation can be re-applied with the
new policy contract.

## What Changes

- Keep `REVIEW` as first-class decision and adapt it to CR-01 behavior.
- Apply coverage bands by `releaseType`:
  - `standard`: `< 70` => `NO_GO`, `70..79.99` => `REVIEW`, `>= 80` => no coverage reason.
  - `hotfix`: `< 65` => `NO_GO`, `65..79.99` => `REVIEW`, `>= 80` => no coverage reason.
- Keep no-go precedence for failed mandatory tests and critical vulnerabilities.
- Change review-only rules to:
  - `security.high >= 3` with `security.critical == 0` => `REVIEW` (`HIGH_SECURITY_RISK`)
  - `lintErrors > 0` => `REVIEW` (`LINT_ERRORS`)
- Keep canonical reason ordering and precedence `NO_GO > REVIEW > GO`.
- Recalculate API statistics expectations from seeded history under CR-01 thresholds.
- Update tests and docs so they stay aligned with executable policy.

## Capabilities

### New Capabilities
- `release-policy`: Decision model and rules for `GO`/`REVIEW`/`NO_GO`, including
  canonical reasons and precedence.

### Modified Capabilities
- None.

## Impact

- Affected backend code: `apps/api/src/services/releaseService.ts`,
  `apps/api/src/constants.ts`, and API route/statistics behavior in
  `apps/api/src/routes/index.ts`.
- Affected contracts: `packages/contracts/src/index.ts` (decision/reason alignment,
  including coverage review reason code and reason ordering).
- Affected tests: `apps/api/test/policy.test.ts` and `apps/api/test/api.test.ts`.
- Affected documentation: `docs/release-policy.md` (and related references where
  decisions are described).
