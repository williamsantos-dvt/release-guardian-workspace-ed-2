## Why

The current coverage policy is binary and does not use `releaseType` or the
already-public `REVIEW` decision. Coverage below 70 blocks all releases, while
coverage above 70 is treated as equally acceptable for both `standard` and
`hotfix` releases.

This prevents us from separating "needs human review" from "must block now", and
it applies the same coverage tolerance to urgent hotfixes and regular releases.

## What Changes

- Introduce a tiered coverage policy by coverage band and `releaseType`.
- Activate `REVIEW` for borderline `standard` releases.
- Keep canonical reason ordering unchanged.
- Preserve the existing `POST /api/v1/evaluations` contract shape.
- Document the behavior as Policy v2.0.0, including v1 vs v2 semantics.

## Capabilities

### New Capabilities

- `policy/tiered-coverage-v2`
  - Coverage `< 70`: always `NO_GO` with `COVERAGE_BELOW_MINIMUM`.
  - Coverage `70-79.999...` + `standard`: `REVIEW` with
    `COVERAGE_BELOW_MINIMUM`.
  - Coverage `70-79.999...` + `hotfix`: `GO` with
    `COVERAGE_BELOW_MINIMUM` as a non-blocking risk signal.
  - Coverage `>= 80`: no coverage reason.
  - Existing hard blockers still force `NO_GO`.

### Modified Capabilities

- `policy/release-evaluation`
  - `REVIEW` is now emitted by the engine.
  - Coverage logic is tiered and release-type aware.
  - `COVERAGE_BELOW_MINIMUM` may be present on `GO` for hotfixes.
  - Reason ordering remains canonical:
    1. `COVERAGE_BELOW_MINIMUM`
    2. `MANDATORY_TEST_FAILURE`
    3. `CRITICAL_SECURITY_VULNERABILITY`
    4. `LINT_ERRORS`

## Impact

- Affected code: `apps/api` policy engine and tests.
- Contracts: no structural API changes; semantics updated.
- Seeds/history statistics: `REVIEW` now appears for borderline standard
  releases.
- Pipeline behavior: `REVIEW` must be treated as blocked until manual,
  auditable approval.
