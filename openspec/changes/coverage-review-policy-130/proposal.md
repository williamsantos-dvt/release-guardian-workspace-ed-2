## Why

The current Release Guardian policy still behaves as a binary gate in practice (`GO` or `NO_GO`) and does not use a coverage-based `REVIEW` decision. This limits risk signaling for medium-confidence releases and creates a mismatch between the public decision contract and runtime behavior.

## What Changes

- Evolve policy evaluation to emit `REVIEW` based only on coverage bands in policy version `1.3.0`.
- Define three coverage bands:
  - `coverage < 60` -> `NO_GO` (`COVERAGE_BELOW_MINIMUM`)
  - `60 <= coverage < 80` -> `REVIEW` (`COVERAGE_REQUIRES_REVIEW`)
  - `coverage >= 80` -> `GO` (no coverage reason)
- Keep existing `NO_GO` blockers unchanged: failed mandatory tests, critical vulnerabilities, and lint errors.
- Preserve API request/response shape while updating decision outcomes and policy snapshot values.
- Update automated tests and policy reference docs to match policy `1.3.0` behavior.

## Capabilities

### New Capabilities
- `release-policy/coverage-review`: Coverage-driven REVIEW decision and reason taxonomy for policy `1.3.0`.

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `apps/api/src/services/releaseService.ts`
  - `apps/api/src/constants.ts`
  - `packages/contracts/src/index.ts`
  - `apps/api/test/policy.test.ts`
  - `apps/api/test/api.test.ts`
  - `docs/release-policy.md`
- API compatibility:
  - No schema shape change for `POST /api/v1/evaluations` responses.
  - Decision values remain within existing contract (`GO|REVIEW|NO_GO`), but runtime now emits `REVIEW` for coverage band `[60,80)`.
- Behavioral impact:
  - Seed re-evaluation distribution changes to `GO: 10`, `REVIEW: 5`, `NO_GO: 3`.
