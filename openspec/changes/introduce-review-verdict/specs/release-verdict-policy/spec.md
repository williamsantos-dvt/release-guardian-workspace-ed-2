## Purpose

Define a deterministic tri-state release verdict policy so pipelines and operators can distinguish blocked releases from releases that require manual review, including release-type-specific coverage thresholds for emergency hotfixes.

## ADDED Requirements

### Requirement: Tiered release verdicts
The system SHALL evaluate submitted release evidence and return exactly one decision from `GO`, `REVIEW`, or `NO_GO`.

#### Scenario: No applicable reasons returns GO
- **WHEN** evidence has no coverage, test, security, or lint violations
- **THEN** the decision is `GO`

#### Scenario: Only review-tier reasons returns REVIEW
- **WHEN** evidence triggers one or more review-tier reasons and no blocking reasons
- **THEN** the decision is `REVIEW`

#### Scenario: Any blocking reason returns NO_GO
- **WHEN** evidence triggers at least one blocking reason
- **THEN** the decision is `NO_GO` even if review-tier reasons are also present

### Requirement: Coverage thresholds depend on release type
The system SHALL apply coverage rules by `releaseType`.

#### Scenario: Standard release below 70 is NO_GO
- **WHEN** `releaseType` is `standard` and `coverage < 70`
- **THEN** the decision is `NO_GO`
- **AND** reasons include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Standard release in 70-79.99 is REVIEW
- **WHEN** `releaseType` is `standard` and `coverage` is between `70` and `79.99`
- **THEN** the decision is `REVIEW`
- **AND** reasons include a dedicated coverage review-band reason

#### Scenario: Hotfix release below 65 is NO_GO
- **WHEN** `releaseType` is `hotfix` and `coverage < 65`
- **THEN** the decision is `NO_GO`
- **AND** reasons include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Hotfix release in 65-79.99 is REVIEW
- **WHEN** `releaseType` is `hotfix` and `coverage` is between `65` and `79.99`
- **THEN** the decision is `REVIEW`
- **AND** reasons include a dedicated coverage review-band reason

#### Scenario: Coverage at or above 80 adds no coverage restriction
- **WHEN** `coverage >= 80` for any supported `releaseType`
- **THEN** coverage contributes no blocking or review reason

### Requirement: Security high risk maps to review tier
The system SHALL treat high-severity security findings as review-tier risk and emit `HIGH_SECURITY_RISK` when `security.high >= 3`.

#### Scenario: High vulnerabilities without blocking reasons
- **WHEN** evidence includes `security.high >= 3` and no blocking reasons
- **THEN** the decision is `REVIEW`
- **AND** reasons include `HIGH_SECURITY_RISK`

#### Scenario: High and critical vulnerabilities together
- **WHEN** evidence includes `security.critical > 0` and `security.high >= 3`
- **THEN** the decision is `NO_GO`
- **AND** reasons include `CRITICAL_SECURITY_VULNERABILITY` and `HIGH_SECURITY_RISK`

### Requirement: Lint errors are review-tier
The system SHALL classify `lintErrors > 0` as review-tier risk.

#### Scenario: Lint-only issue yields REVIEW
- **WHEN** evidence includes `lintErrors > 0` and no blocking reasons
- **THEN** the decision is `REVIEW`
- **AND** reasons include `LINT_ERRORS`

### Requirement: Canonical reason reporting
The system MUST return all applicable reason codes in a deterministic canonical order for auditability.

#### Scenario: Mixed reasons keep canonical ordering
- **WHEN** evidence triggers multiple reasons across coverage, tests, security, and lint
- **THEN** the response contains each applicable reason exactly once
- **AND** the reasons appear in canonical policy order

### Requirement: API-compatible tri-state propagation
The system SHALL propagate tri-state decisions consistently across evaluation APIs and aggregate statistics without changing existing request/response shapes.

#### Scenario: Evaluation response includes REVIEW as a valid decision
- **WHEN** an evaluation produces a review-tier outcome
- **THEN** `POST /api/v1/evaluations` returns `decision: REVIEW` with applicable reasons

#### Scenario: Statistics include review counts
- **WHEN** stored evaluations include at least one `REVIEW` decision
- **THEN** `GET /api/v1/statistics` reports `byDecision.REVIEW` greater than zero

### Requirement: CR-01 acceptance behavior for hotfix scenario
The system SHALL satisfy the canonical CR-01 acceptance scenario.

#### Scenario: Hotfix release with 67 coverage becomes REVIEW
- **WHEN** the `hotfix-release` scenario is evaluated with healthy non-coverage signals and `coverage = 67`
- **THEN** the decision is `REVIEW`

#### Scenario: Standard release with the same coverage remains NO_GO
- **WHEN** a `standard` release is evaluated with healthy non-coverage signals and `coverage = 67`
- **THEN** the decision is `NO_GO`
