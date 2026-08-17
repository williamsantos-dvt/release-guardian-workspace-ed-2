## MODIFIED Requirements

### Requirement: Decision set and precedence
The policy engine MUST return exactly one decision from `GO`, `REVIEW`, or `NO_GO` for each valid evaluation request.
Decision precedence MUST be `NO_GO > REVIEW > GO`.
`tests.failed > 0` and `security.critical > 0` MUST always produce `NO_GO` regardless of coverage or review-level signals.

#### Scenario: NO_GO precedence over review-level signals
- **WHEN** a release has `tests.failed > 0`, `security.high >= 3`, and coverage in a review band
- **THEN** the final decision is `NO_GO`

#### Scenario: REVIEW precedence over GO
- **WHEN** a release has no `NO_GO` blocker, has `lintErrors > 0`, and coverage in a GO band
- **THEN** the final decision is `REVIEW`

### Requirement: Hard blocker mapping
The policy engine MUST emit `NO_GO` when any hard blocker condition is true and MUST include matching reason codes.
The hard blocker mapping MUST be: `tests.failed > 0` -> `MANDATORY_TEST_FAILURE`, `security.critical > 0` -> `CRITICAL_SECURITY_VULNERABILITY`.
`security.high` and `lintErrors` MUST NOT be treated as hard blockers in this change.

#### Scenario: Critical vulnerability remains hard blocker
- **WHEN** `security.critical > 0`
- **THEN** decision is `NO_GO` and `reasons` includes `CRITICAL_SECURITY_VULNERABILITY`

#### Scenario: High severity threshold is not a hard blocker
- **WHEN** `security.high >= 3` and no hard blocker exists
- **THEN** decision is not forced to `NO_GO` by `security.high` alone

### Requirement: Coverage bands by release type
When no hard blocker exists, coverage evaluation MUST use thresholds by `releaseType`.
For `standard`: `coverage < 70` MUST yield `NO_GO`; `70 <= coverage < 80` MUST yield at least `REVIEW`; `coverage >= 80` MUST not trigger coverage restrictions.
For `hotfix`: `coverage < 65` MUST yield `NO_GO`; `65 <= coverage < 80` MUST yield at least `REVIEW`; `coverage >= 80` MUST not trigger coverage restrictions.

#### Scenario: Hotfix review band from CR-01
- **WHEN** `releaseType = hotfix`, no hard blocker exists, and `coverage = 67`
- **THEN** decision is `REVIEW`

#### Scenario: Standard remains blocked at 67
- **WHEN** `releaseType = standard`, no hard blocker exists, and `coverage = 67`
- **THEN** decision is `NO_GO`

### Requirement: Reason set semantics by decision
Review-level signals MUST include: `security.high >= 3` -> `HIGH_SECURITY_RISK`, `lintErrors > 0` -> `LINT_ERRORS`, and coverage in review band -> `COVERAGE_BELOW_MINIMUM`.
For `NO_GO` caused only by low coverage (without hard blockers), `reasons` MUST include `COVERAGE_BELOW_MINIMUM`.
For `REVIEW`, `reasons` MUST include all applicable review-level reason codes and MUST exclude hard-blocker codes unless those blockers are actually present.

#### Scenario: Review with multiple review-level reasons
- **WHEN** no hard blocker exists, `releaseType = hotfix`, `coverage = 70`, `security.high = 4`, and `lintErrors = 2`
- **THEN** decision is `REVIEW` and `reasons` includes `COVERAGE_BELOW_MINIMUM`, `HIGH_SECURITY_RISK`, and `LINT_ERRORS`

#### Scenario: GO without review-level signals
- **WHEN** no hard blocker exists, coverage is in GO band, `security.high < 3`, and `lintErrors = 0`
- **THEN** decision is `GO` and `reasons` is empty

### Requirement: Canonical reason ordering
When multiple reasons are returned, their order MUST remain canonical: `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `HIGH_SECURITY_RISK`, `LINT_ERRORS`.

#### Scenario: Canonical order in mixed NO_GO case
- **WHEN** low coverage and hard blockers/review-level signals occur in one evaluation
- **THEN** `reasons` is returned in canonical order

### Requirement: HTTP compatibility and statistics continuity
The API MUST preserve request and response schema shapes and status codes for existing endpoints.
`POST /api/v1/evaluations` MUST continue returning `201` for valid evidence and `400` for invalid payloads.
`GET /api/v1/policy` MUST keep stable shape and report `minimumCoverage = 70`.
`GET /api/v1/statistics` MUST continue counting `GO`, `REVIEW`, and `NO_GO`, and include `HIGH_SECURITY_RISK`/`LINT_ERRORS` in top reasons when present.

#### Scenario: Policy snapshot minimum remains semantic minimum
- **WHEN** policy snapshot is requested
- **THEN** response shape is unchanged and `minimumCoverage` equals `70`

#### Scenario: CR-01 acceptance scenario
- **WHEN** pipeline simulates `hotfix-release` (`releaseType = hotfix`, `coverage = 67`, healthy remaining signals)
- **THEN** evaluation result is `REVIEW`
