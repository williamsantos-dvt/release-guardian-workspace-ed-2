## Purpose

Define a deterministic release decision policy with explicit manual review outcomes, preserving the HTTP contract while improving risk handling for production releases.

## ADDED Requirements

### Requirement: Decision set and precedence
The policy engine MUST return exactly one decision from `GO`, `REVIEW`, or `NO_GO` for each valid evaluation request.
Hard blockers MUST take precedence over coverage evaluation.

#### Scenario: Hard blocker precedence over high coverage
- **WHEN** a release has `coverage >= 90` and `tests.failed > 0`
- **THEN** the final decision is `NO_GO`

#### Scenario: Coverage path without blockers
- **WHEN** a release has `tests.failed = 0`, `security.critical = 0`, `security.high = 0`, and `lintErrors = 0`
- **THEN** the final decision is derived only from coverage thresholds for its `releaseType`

### Requirement: Hard blocker mapping
The policy engine MUST emit `NO_GO` when any hard blocker condition is true and MUST include matching reason codes.
The blocker-to-reason mapping MUST be: `tests.failed > 0` -> `MANDATORY_TEST_FAILURE`, `security.critical > 0` -> `CRITICAL_SECURITY_VULNERABILITY`, `security.high > 0` -> `HIGH_SECURITY_RISK`, `lintErrors > 0` -> `LINT_ERRORS`.

#### Scenario: High severity vulnerability blocks release
- **WHEN** `security.high > 0`
- **THEN** decision is `NO_GO` and `reasons` includes `HIGH_SECURITY_RISK`

#### Scenario: Multiple hard blockers include all mapped reasons
- **WHEN** `tests.failed > 0`, `security.critical > 0`, and `lintErrors > 0`
- **THEN** decision is `NO_GO` and `reasons` includes all mapped reason codes for those conditions

### Requirement: Coverage bands by release type
When no hard blockers exist, coverage evaluation MUST use thresholds by `releaseType`.
For `standard`: `coverage >= STANDARD_GO_MIN` MUST yield `GO`; `STANDARD_REVIEW_MIN <= coverage < STANDARD_GO_MIN` MUST yield `REVIEW`; `coverage < STANDARD_REVIEW_MIN` MUST yield `NO_GO`.
For `hotfix`: `coverage >= HOTFIX_GO_MIN` MUST yield `GO`; `HOTFIX_REVIEW_MIN <= coverage < HOTFIX_GO_MIN` MUST yield `REVIEW`; `coverage < HOTFIX_REVIEW_MIN` MUST yield `NO_GO`.
Threshold invariants MUST hold: `0 <= REVIEW_MIN < GO_MIN <= 100` for each type, `HOTFIX_REVIEW_MIN >= STANDARD_REVIEW_MIN`, and `HOTFIX_GO_MIN >= STANDARD_GO_MIN`.

#### Scenario: Standard release in review band
- **WHEN** `releaseType = standard`, no hard blockers, and coverage is between `STANDARD_REVIEW_MIN` and `STANDARD_GO_MIN`
- **THEN** decision is `REVIEW`

#### Scenario: Hotfix below review minimum
- **WHEN** `releaseType = hotfix`, no hard blockers, and `coverage < HOTFIX_REVIEW_MIN`
- **THEN** decision is `NO_GO`

### Requirement: Reason set semantics by decision
For `REVIEW`, `reasons` MUST contain only `COVERAGE_BELOW_MINIMUM`.
For coverage-only `NO_GO`, `reasons` MUST contain only `COVERAGE_BELOW_MINIMUM`.
For hard-blocker `NO_GO`, `reasons` MUST include the mapped blocker reason codes.

#### Scenario: Review reason isolation
- **WHEN** decision is `REVIEW`
- **THEN** `reasons` equals `["COVERAGE_BELOW_MINIMUM"]`

#### Scenario: Coverage-only no-go reason isolation
- **WHEN** decision is `NO_GO` due to coverage below the review minimum and no hard blockers
- **THEN** `reasons` equals `["COVERAGE_BELOW_MINIMUM"]`

### Requirement: Canonical reason ordering
When multiple reasons are returned, their order MUST be stable and canonical: `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `HIGH_SECURITY_RISK`, `LINT_ERRORS`.

#### Scenario: Stable order under combined failures
- **WHEN** low coverage and all hard blockers occur in one evaluation
- **THEN** `reasons` is returned exactly in canonical order

### Requirement: HTTP compatibility and statistics continuity
The API MUST preserve request and response schema shapes and status codes for existing endpoints.
`POST /api/v1/evaluations` MUST continue returning `201` for valid evidence and `400` for invalid payloads.
`GET /api/v1/statistics` MUST include `REVIEW` counts in `byDecision` and MUST include `HIGH_SECURITY_RISK` in `topBlockingReasons` when present in evaluated history.

#### Scenario: Evaluation response shape remains stable
- **WHEN** a valid evaluation request is submitted after this change
- **THEN** response contains the same fields as before and `decision` may be `GO`, `REVIEW`, or `NO_GO`

#### Scenario: Statistics include review and high-risk reason
- **WHEN** evaluation history contains at least one `REVIEW` and one `HIGH_SECURITY_RISK`
- **THEN** `byDecision.REVIEW > 0` and `topBlockingReasons` includes `HIGH_SECURITY_RISK`
