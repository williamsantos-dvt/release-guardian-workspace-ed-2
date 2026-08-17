## Overview

This change evolves the legacy policy engine (`apps/api/src/services/releaseService.ts`) to:

- Emit all three decisions `GO`, `REVIEW`, `NO_GO` according to CR-01 thresholds (`docs/change-requests/cr-01-hotfix-policy.md:18`-`docs/change-requests/cr-01-hotfix-policy.md:34`).
- Formalize precedence `NO_GO > REVIEW > GO`, respecting invariants em `AGENTS.md:71`-`AGENTS.md:79`.
- Keep the HTTP contract frozen (`packages/contracts/src/index.ts:47`-`packages/contracts/src/index.ts:55`), seeds deterministic (`apps/api/src/seeds/seedData.ts:14`-`apps/api/src/seeds/seedData.ts:32`), and external consumers unchanged (`apps/dashboard/**`, `scripts/simulate-pipeline.cjs`).

## Engine refactor

### Extract literals and centralize thresholds

1. **Extract literal 70**
   - Replace the `coverage < 70` literal check in `evaluateRelease` (`apps/api/src/services/releaseService.ts:19`) with `coverage < MINIMUM_COVERAGE`, using `MINIMUM_COVERAGE` from `apps/api/src/constants.ts:5`.
   - Keep `/api/v1/policy` aligned by continuing to call `getMinimumCoverage` (`apps/api/src/services/releaseService.ts:60`-`apps/api/src/services/releaseService.ts:61`, `apps/api/src/routes/index.ts:24`).
   - Move `HOTFIX_MINIMUM_COVERAGE` and `REVIEW_COVERAGE_THRESHOLD` to `apps/api/src/constants.ts` so all coverage thresholds live in one place.

2. **Introduce derived thresholds per release type**
   - Inside `evaluateRelease`, compute derived thresholds:

     - For `releaseType === 'standard'`:
       - `standard_no_go_threshold = MINIMUM_COVERAGE` (70).
       - `standard_review_min = MINIMUM_COVERAGE` (70).
       - `review_max = 80`.

     - For `releaseType === 'hotfix'`:
       - `hotfix_no_go_threshold = 65` (CR-01:32).
       - `hotfix_review_min = 65`.
       - `review_max = 80`.

   - Do this in a small local helper within the function to keep the change minimal and self-contained.

### Compute coverage decision contribution

3. **Compute coverage decision first, but store as “candidate”**
   - Instead of directly pushing `COVERAGE_BELOW_MINIMUM` and flipping `decision` to `NO_GO` immediately, compute coverage contribution:

     - For each release, compute a `coverageDecision` (`GO`, `REVIEW`, `NO_GO`) based on the thresholds.
     - Add `COVERAGE_BELOW_MINIMUM` when `coverageDecision === 'NO_GO'`.
     - Add `COVERAGE_BELOW_TARGET` when `coverageDecision === 'REVIEW'` so REVIEW decisions from coverage remain auditable.

   - This allows later precedence logic to be explicit: high-priority reasons (critical, mandatory tests) can override coverage, while coverage `REVIEW` becomes a candidate decision.

### Precedence structure

4. **Formal precedence chain**
   - Introduce boolean flags for “hard blockers”:

     - `hasMandatoryTestsFailure`
     - `hasCriticalVulnerability`
     - `hasCoverageBlock` (coverageDecision === 'NO_GO')

   - Introduce flags for “review signals”:

     - `hasCoverageReviewBand` (coverageDecision === 'REVIEW')
     - `hasHighVulnerabilitiesReview` (`security.high >= 3`)
     - `hasLintReview` (`lintErrors > 0`)

   - Compute reasons in canonical order, unchanged:

     - Coverage blocker reason if `hasCoverageBlock`.
     - Mandatory tests failure reason.
     - Critical vulnerabilities reason.
     - Lint reason.
      - Include `COVERAGE_BELOW_TARGET` immediately after `COVERAGE_BELOW_MINIMUM` in canonical order.
      - Include `HIGH_SECURITY_RISK` before `LINT_ERRORS`.

   - Decide final decision:

     - If any hard blocker flag is true (`hasMandatoryTestsFailure || hasCriticalVulnerability || hasCoverageBlock`) -> `NO_GO`.
     - Else if any review flag is true (`hasCoverageReviewBand || hasHighVulnerabilitiesReview || hasLintReview`) -> `REVIEW`.
     - Else -> `GO`.

   - This explicit precedence respects the invariants em `AGENTS.md:74` e CR-01:42.

### Seeds and statistics

5. **Seeds**
   - Keep `SEED_EVALUATIONS` unchanged (`apps/api/src/seeds/seedData.ts:14`-`apps/api/src/seeds/seedData.ts:32`).
   - Let `EvaluationRepository` re-evaluate seeds on startup (`apps/api/src/repository/evaluationRepository.ts:13`-`apps/api/src/repository/evaluationRepository.ts:20`); decisions for seeds (e.g. EV-0016) will be altered by the new policy.

6. **Statistics**
   - `GET /api/v1/statistics` (`apps/api/src/routes/index.ts:78`-`apps/api/src/routes/index.ts:93`) already counts `GO`, `REVIEW`, `NO_GO`.
   - Adjust only the expected snapshot in `apps/api/test/api.test.ts:95`-`apps/api/test/api.test.ts:104` to reflect new distribution; code route remains unchanged.

## Testing strategy

- Extend `apps/api/test/policy.test.ts` with:

  - Standard coverage bands (below 70, 70–79.99, >=80).
  - Hotfix coverage bands (below 65, 65–79.99, >=80).
  - Precedence cases: critical and mandatory tests always `NO_GO`, even in REVIEW bands.
  - REVIEW cases: high vulns >=3, lintErrors >0, coverage REVIEW bands.

- Update `apps/api/test/api.test.ts`:

  - `GET /api/v1/statistics` expected `byDecision` recalculated.
  - Optional acceptance tests using `examples/hotfix-release.json`.

## Contracts and external consumers

- Keep request/response shapes unchanged, but extend policy metadata additively:
  - `GET /api/v1/policy` keeps existing fields (`policyVersion`, `minimumCoverage`, `supportedReleaseTypes`).
  - `GET /api/v1/policy` adds `coverageThresholdsByReleaseType` with `standard.minimum`, `standard.reviewBelow`, `hotfix.minimum`, `hotfix.reviewBelow`.
  - This is additive and therefore does not break current consumers of the existing fields.
- Update `REASON_CODES` to include `COVERAGE_BELOW_TARGET` and `HIGH_SECURITY_RISK` in canonical order.
- Leave `apps/dashboard/**` and `scripts/simulate-pipeline.cjs` untouched; they already handle NEW decision `REVIEW`.
