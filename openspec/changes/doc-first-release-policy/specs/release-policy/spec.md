## Purpose

Define a consistent release-readiness decision policy that aligns runtime behavior with documented coverage requirements and activates review-based handling for non-critical high security risk.

## ADDED Requirements

### Requirement: Coverage minimum is 75 percent
The system MUST enforce a minimum coverage threshold of 75 percent for all release types.

#### Scenario: Release below threshold is blocked
- **WHEN** a release evidence payload has `coverage` below 75 and no other failing signals
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** reasons MUST include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Release at threshold is not blocked by coverage
- **WHEN** a release evidence payload has `coverage` equal to 75 and no other failing signals
- **THEN** coverage alone MUST NOT block the release

### Requirement: High security risk requires manual review
The system MUST classify non-critical high vulnerabilities as review-required risk.

#### Scenario: High vulnerabilities with no critical findings
- **WHEN** `security.critical` is 0 and `security.high` is greater than 0
- **THEN** the evaluation decision MUST be `REVIEW` when no blocking reason is present
- **AND** reasons MUST include `HIGH_SECURITY_RISK`

#### Scenario: Critical vulnerabilities still block release
- **WHEN** `security.critical` is greater than 0
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** reasons MUST include `CRITICAL_SECURITY_VULNERABILITY`

### Requirement: Decision composition is deterministic
The system MUST compose a single decision from all applicable reasons using a stable priority.

#### Scenario: Blocking reason overrides review reason
- **WHEN** both blocking and review reasons are applicable in the same evaluation
- **THEN** the final decision MUST be `NO_GO`

#### Scenario: Review reason applies without blockers
- **WHEN** review reasons are applicable and no blocking reason is present
- **THEN** the final decision MUST be `REVIEW`

### Requirement: Reason ordering is canonical
The system MUST emit reasons in a stable canonical order for reproducibility and testability.

#### Scenario: Multiple reasons are emitted in canonical order
- **WHEN** coverage below threshold, failed tests, lint errors, and high risk are all present without critical vulnerability
- **THEN** reasons MUST be emitted in this exact order:
- **AND** `COVERAGE_BELOW_MINIMUM`
- **AND** `MANDATORY_TEST_FAILURE`
- **AND** `LINT_ERRORS`
- **AND** `HIGH_SECURITY_RISK`
