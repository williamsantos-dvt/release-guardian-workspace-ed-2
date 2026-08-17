# Coverage Truth Source Report

Date: 2026-08-17

This document captures the verified baseline for coverage-related behavior in this repository.

## 1) What the docs say about coverage

- `docs/release-policy.md` states a minimum policy coverage of **75%**.
- `README.md` and `scripts/validate.mjs` state that `coverage` is part of the validation pipeline (`typecheck -> lint -> test -> coverage -> smoke`).

## 2) What unit tests actually enforce (percentage)

The implementation and tests enforce a minimum policy coverage of **70%**, not 75%.

Evidence:

- `apps/api/src/constants.ts` defines `MINIMUM_COVERAGE = 70`.
- `apps/api/src/services/releaseService.ts` blocks only when `coverage < 70`.
- `apps/api/test/policy.test.ts` approves coverage `72` and blocks `63`.
- `apps/api/test/api.test.ts` expects `minimumCoverage: 70` in `GET /api/v1/policy`.

## 3) How much code tests truly validate

### Raw coverage command result

From `npm run coverage`:

- Test files: 2
- Tests: 15
- Statements: 100%
- Branches: 92.85%
- Functions: 100%
- Lines: 100%

Important: this 100% view applies to instrumented/loaded files only.

### Practical validation scope

- In `apps/api/src` + `packages/contracts/src`: **7/9 files covered** (77.8%).
- Uncovered files in that scope:
  - `apps/api/src/index.ts`
  - `apps/api/src/utils.ts`
- Including dashboard and scripts (`apps/dashboard/src` + `scripts`): **7/14 files covered** (50%).

## Source of truth recommendation

For current runtime behavior, treat **implementation + tests** as source of truth for coverage threshold (**70%**).

`docs/release-policy.md` is currently inconsistent on this specific rule (it says 75%).
