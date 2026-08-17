## Why

The current policy engine only emits `GO` and `NO_GO`, while the shared contract,
dashboard, and simulator already support `REVIEW`. This creates behavior drift and
prevents manual-approval outcomes that are required by the release policy evolution.

## What Changes

- Add `REVIEW` as a real decision emitted by the backend policy engine.
- Introduce review-level rules for:
  - releases with `security.high > 0` and `security.critical == 0`, and
  - releases with coverage between `60` and `79` (inclusive).
- Convert coverage into explicit policy bands:
  - coverage `< 60` => `NO_GO`,
  - coverage `60..79` => `REVIEW`,
  - coverage `>= 80` => no coverage-driven restriction.
- Add/align reason code support for review outcomes and keep canonical ordering.
- Update policy/API tests and seed-based statistics expectations for the new
  decision distribution.
- Update policy documentation to match executable behavior and keep docs/tests/code
  synchronized.

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
  including coverage review reason code).
- Affected tests: `apps/api/test/policy.test.ts` and `apps/api/test/api.test.ts`.
- Affected documentation: `docs/release-policy.md` (and related references where
  decisions are described).
