## Why

CR-01 requires an emergency policy hotfix so hotfix releases are not evaluated with the same coverage thresholds as standard releases. The current runtime policy (1.3.0) applies a single coverage threshold model and does not satisfy the CR acceptance scenario for `hotfix-release`.

## What Changes

- Evolve release policy to version `1.4.0`.
- Apply coverage thresholds by release type:
  - `standard`: `< 70` => `NO_GO`, `70 <= x < 80` => `REVIEW`, `>= 80` => `GO`
  - `hotfix`: `< 65` => `NO_GO`, `65 <= x < 80` => `REVIEW`, `>= 80` => `GO`
- Keep decision precedence `NO_GO > REVIEW > GO`.
- Reintroduce `HIGH_SECURITY_RISK` as `REVIEW` when `security.high >= 3` (without critical).
- Reclassify `LINT_ERRORS` to `REVIEW` (no longer blocking by itself).
- Preserve request/response HTTP schema shape.
- Align docs, automated tests, and simulator acceptance (`hotfix-release` => `REVIEW`).

## Capabilities

### New Capabilities
- `release-policy/hotfix-thresholds`: policy behavior that differentiates coverage decisions by release type and updates review-level reasons.

### Modified Capabilities
- None.

## Impact

- Affected code:
  - `apps/api/src/constants.ts`
  - `apps/api/src/services/releaseService.ts`
  - `packages/contracts/src/index.ts`
  - `apps/api/test/policy.test.ts`
  - `apps/api/test/api.test.ts`
  - `docs/release-policy.md`
- Policy snapshot changes:
  - `policyVersion` becomes `1.4.0`
  - `minimumCoverage` represents hotfix minimum threshold (`65`)
- Contract compatibility:
  - No shape changes in `POST /api/v1/evaluations` request or response bodies.
