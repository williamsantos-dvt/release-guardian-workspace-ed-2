## Why

The challenge requires evolving Release Guardian from a binary decision model (`GO`/`NO_GO`) to a tri-state model that includes `REVIEW` for releases that should not be auto-blocked but still require manual approval. CR-01 adds a policy pivot: coverage thresholds now depend on `releaseType` (`standard` vs `hotfix`), so the current plan must be updated to keep behavior, tests, and documentation aligned.

## What Changes

- Keep explicit decision precedence across reason severities: blocking reasons produce `NO_GO`, review-only reasons produce `REVIEW`, and clean evidence produces `GO`.
- Apply coverage thresholds by release type per CR-01:
  - `standard`: `< 70 => NO_GO`, `70-79.99 => REVIEW`, `>= 80 => no coverage restriction`
  - `hotfix`: `< 65 => NO_GO`, `65-79.99 => REVIEW`, `>= 80 => no coverage restriction`
- Keep unchanged CR-01 gates and thresholds: `tests.failed > 0 => NO_GO`, `security.critical > 0 => NO_GO`, `security.high >= 3 => REVIEW`, `lintErrors > 0 => REVIEW`.
- Preserve endpoint contract shape for `POST /api/v1/evaluations` and align docs/simulator/tests with the CR acceptance scenario (`hotfix-release` at 67% becomes `REVIEW`).

## Capabilities

### New Capabilities
- `release-verdict-policy`: Defines how evidence reasons map to decision tiers (`GO`, `REVIEW`, `NO_GO`), including release-type coverage thresholds, precedence, and canonical reason handling.

### Modified Capabilities
- None.

## Impact

- Affected code areas: API policy engine, seeded/statistical decision aggregation paths, shared contracts usage, simulator scenarios, and policy documentation.
- API compatibility: no request/response shape change; only decision semantics are expanded to fully activate the existing `REVIEW` contract value.
- Validation impact: test matrix and functional validation scenarios must assert tri-state behavior, release-type coverage percentages, and precedence.
