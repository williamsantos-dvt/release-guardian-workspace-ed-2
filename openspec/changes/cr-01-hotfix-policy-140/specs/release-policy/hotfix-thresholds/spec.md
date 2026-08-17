## Purpose

Define policy version 1.4.0 behavior for release-type-specific coverage thresholds and review-level risk signals required by CR-01.

## ADDED Requirements

### Requirement: Coverage thresholds depend on release type
The policy engine MUST apply distinct coverage bands for `standard` and `hotfix` releases.

#### Scenario: Standard release below minimum blocks
- **WHEN** evidence has `releaseType = standard` and `coverage < 70`
- **THEN** reasons include `COVERAGE_BELOW_MINIMUM` and final decision is `NO_GO`

#### Scenario: Standard release in review band
- **WHEN** evidence has `releaseType = standard` and `70 <= coverage < 80` and no blocking reasons
- **THEN** reasons include `COVERAGE_REQUIRES_REVIEW` and final decision is `REVIEW`

#### Scenario: Hotfix release below minimum blocks
- **WHEN** evidence has `releaseType = hotfix` and `coverage < 65`
- **THEN** reasons include `COVERAGE_BELOW_MINIMUM` and final decision is `NO_GO`

#### Scenario: Hotfix release in review band
- **WHEN** evidence has `releaseType = hotfix` and `65 <= coverage < 80` and no blocking reasons
- **THEN** reasons include `COVERAGE_REQUIRES_REVIEW` and final decision is `REVIEW`

### Requirement: Security high risk triggers review
The policy engine MUST emit a review-level reason for non-critical high vulnerabilities.

#### Scenario: High vulnerabilities require review
- **WHEN** evidence has `security.critical = 0` and `security.high >= 3` and no blocking reasons
- **THEN** reasons include `HIGH_SECURITY_RISK` and final decision is `REVIEW`

### Requirement: Lint errors trigger review
The policy engine MUST treat lint errors as review-level signals.

#### Scenario: Lint-only release requires review
- **WHEN** evidence has `lintErrors > 0` and no blocking reasons
- **THEN** reasons include `LINT_ERRORS` and final decision is `REVIEW`

### Requirement: Decision precedence remains severity-first
The policy engine MUST resolve decisions with precedence `NO_GO > REVIEW > GO`.

#### Scenario: Blocking reason overrides review reasons
- **WHEN** evidence has at least one blocking reason and at least one review reason
- **THEN** final decision is `NO_GO` and all applicable reasons are returned in canonical order

### Requirement: CR-01 acceptance scenario for hotfix-release
The canonical hotfix scenario from CR-01 MUST evaluate as review after this change.

#### Scenario: hotfix-release evaluates as REVIEW
- **WHEN** `examples/hotfix-release.json` is submitted
- **THEN** final decision is `REVIEW` with `COVERAGE_REQUIRES_REVIEW`
