## Purpose

Define a stable release-policy decision model that can emit GO, REVIEW, or
NO_GO and stays consistent across API responses, tests, and documentation,
including CR-01 coverage thresholds by release type.

## ADDED Requirements

### Requirement: Policy engine emits three decision outcomes
The release policy engine MUST return one of `GO`, `REVIEW`, or `NO_GO` for each
evaluation request.

#### Scenario: Healthy evidence returns GO
- **WHEN** evidence has no blocking conditions and no review conditions
- **THEN** the decision is `GO` and reasons are empty

#### Scenario: Reviewable evidence returns REVIEW
- **WHEN** evidence has at least one review condition and no blocking conditions
- **THEN** the decision is `REVIEW`

#### Scenario: Blocking evidence returns NO_GO
- **WHEN** evidence has at least one blocking condition
- **THEN** the decision is `NO_GO`

### Requirement: Coverage thresholds depend on release type
Coverage MUST be evaluated with policy bands specific to `releaseType`.

- For `standard` releases:
  - coverage `< 70` => blocking reason `COVERAGE_BELOW_MINIMUM`
  - coverage `70..79.99` => review reason `COVERAGE_REQUIRES_REVIEW`
  - coverage `>= 80` => no coverage reason
- For `hotfix` releases:
  - coverage `< 65` => blocking reason `COVERAGE_BELOW_MINIMUM`
  - coverage `65..79.99` => review reason `COVERAGE_REQUIRES_REVIEW`
  - coverage `>= 80` => no coverage reason

#### Scenario: Standard release with coverage 67 is blocked
- **WHEN** evidence has `releaseType = standard` and coverage `67`
- **THEN** the decision is `NO_GO`
- **AND** reasons include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Hotfix release with coverage 67 requires review
- **WHEN** evidence has `releaseType = hotfix` and coverage `67`
- **THEN** the decision is `REVIEW`
- **AND** reasons include `COVERAGE_REQUIRES_REVIEW`

#### Scenario: Standard release with coverage 75 requires review
- **WHEN** evidence has `releaseType = standard` and coverage `75`
- **THEN** the decision is `REVIEW`

#### Scenario: Hotfix release with coverage 64 is blocked
- **WHEN** evidence has `releaseType = hotfix` and coverage `64`
- **THEN** the decision is `NO_GO`

#### Scenario: Coverage at or above 80 is not restricted
- **WHEN** evidence coverage is `80` and no other condition exists
- **THEN** the decision is `GO`
- **AND** reasons do not include coverage-related reason codes

### Requirement: High security risk requires manual review
If `security.high >= 3` and `security.critical = 0`, the system MUST classify the
evaluation as review-level risk.

#### Scenario: High threshold triggers review
- **WHEN** evidence has three high vulnerabilities and zero critical vulnerabilities
- **THEN** the decision is `REVIEW`
- **AND** reasons include `HIGH_SECURITY_RISK`

#### Scenario: High vulnerabilities below threshold do not trigger review reason
- **WHEN** evidence has two high vulnerabilities and zero critical vulnerabilities
- **THEN** reasons do not include `HIGH_SECURITY_RISK`

### Requirement: Lint errors are review-level findings
If `lintErrors > 0`, the system MUST classify lint as review-level risk.

#### Scenario: Lint errors without blocking reasons require review
- **WHEN** evidence has `lintErrors > 0` and no blocking condition
- **THEN** the decision is `REVIEW`
- **AND** reasons include `LINT_ERRORS`

### Requirement: Blocking rules keep precedence over review rules
Blocking reasons MUST override review-level reasons in final decision selection.
Blocking reasons are `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, and
`CRITICAL_SECURITY_VULNERABILITY`.
Review reasons are `COVERAGE_REQUIRES_REVIEW`, `HIGH_SECURITY_RISK`, and
`LINT_ERRORS`.

#### Scenario: Critical and high vulnerabilities together still block
- **WHEN** evidence has `security.critical > 0` and `security.high > 0`
- **THEN** the decision is `NO_GO`
- **AND** reasons include `CRITICAL_SECURITY_VULNERABILITY`

#### Scenario: Failed tests and high vulnerabilities still block
- **WHEN** evidence has `tests.failed > 0` and `security.high > 0`
- **THEN** the decision is `NO_GO`
- **AND** reasons include `MANDATORY_TEST_FAILURE`

#### Scenario: Blocking reason overrides coverage review band
- **WHEN** evidence has coverage 75 and `tests.failed > 0`
- **THEN** the decision is `NO_GO`
- **AND** reasons include both `COVERAGE_REQUIRES_REVIEW` and `MANDATORY_TEST_FAILURE`

#### Scenario: Blocking reason overrides lint review
- **WHEN** evidence has `lintErrors > 0` and `security.critical > 0`
- **THEN** the decision is `NO_GO`
- **AND** reasons include both `LINT_ERRORS` and `CRITICAL_SECURITY_VULNERABILITY`

### Requirement: Reason ordering is canonical and stable
When multiple policy reasons apply, the system MUST return reasons in this order:
`COVERAGE_BELOW_MINIMUM`, `COVERAGE_REQUIRES_REVIEW`,
`MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`,
`HIGH_SECURITY_RISK`, `LINT_ERRORS`.

#### Scenario: Multiple reasons are returned in canonical order
- **WHEN** an evaluation triggers multiple blocking and review reasons
- **THEN** the reasons array follows the canonical order exactly

### Requirement: Policy snapshot exposes blocking minimum coverage
Policy snapshot output MUST stay aligned with the blocking coverage minimum.

#### Scenario: Policy endpoint exposes the same threshold
- **WHEN** a client requests the policy snapshot
- **THEN** `minimumCoverage` is 70
