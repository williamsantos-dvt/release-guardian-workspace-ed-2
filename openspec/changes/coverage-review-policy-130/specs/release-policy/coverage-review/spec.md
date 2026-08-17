## Purpose

Define policy version 1.3.0 coverage behavior so medium-coverage releases require manual review while preserving existing blocking semantics and API compatibility.

## ADDED Requirements

### Requirement: Coverage band classification
The policy engine MUST classify coverage into three bands for policy version `1.3.0`.

#### Scenario: Coverage at or above GO threshold
- **WHEN** submitted evidence has `coverage >= 80` and no blocking reasons
- **THEN** the evaluation decision is `GO` and no coverage reason is emitted

#### Scenario: Coverage in review band
- **WHEN** submitted evidence has `60 <= coverage < 80` and no blocking reasons
- **THEN** the evaluation decision is `REVIEW` and reasons include `COVERAGE_REQUIRES_REVIEW`

#### Scenario: Coverage below minimum threshold
- **WHEN** submitted evidence has `coverage < 60`
- **THEN** the evaluation decision is `NO_GO` and reasons include `COVERAGE_BELOW_MINIMUM`

### Requirement: Decision precedence
The policy engine MUST derive final decisions by severity precedence: `NO_GO` over `REVIEW` over `GO`.

#### Scenario: Blocking reason overrides coverage review
- **WHEN** submitted evidence has `60 <= coverage < 80` and at least one blocking reason (failed tests, critical vulnerability, or lint errors)
- **THEN** the final decision is `NO_GO` and both blocking and coverage reasons are present when applicable

### Requirement: Coverage review reason taxonomy
The policy engine MUST use a dedicated reason for coverage-driven review and preserve stable reason ordering.

#### Scenario: Coverage review uses dedicated reason code
- **WHEN** coverage falls in the review band and no blocking reason applies
- **THEN** reasons include `COVERAGE_REQUIRES_REVIEW` and do not include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Stable reason ordering with mixed reasons
- **WHEN** multiple reasons apply in a single evaluation
- **THEN** reasons are returned in this order, filtered to applicable items: `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `COVERAGE_REQUIRES_REVIEW`, `LINT_ERRORS`

### Requirement: Policy snapshot reflects coverage policy 1.3.0
The policy snapshot endpoint MUST expose thresholds and version values matching the coverage-review policy.

#### Scenario: Policy snapshot values
- **WHEN** a client requests `GET /api/v1/policy`
- **THEN** response includes `policyVersion = "1.3.0"`, `minimumCoverage = 60`, and supported release types `standard` and `hotfix`

### Requirement: Security-high remains neutral in 1.3.0
Policy version `1.3.0` MUST NOT produce `REVIEW` from `security.high` alone.

#### Scenario: High-only security findings do not change decision
- **WHEN** submitted evidence has `security.critical = 0`, `security.high > 0`, and coverage in GO band
- **THEN** decision remains `GO` unless another review or blocking reason applies
