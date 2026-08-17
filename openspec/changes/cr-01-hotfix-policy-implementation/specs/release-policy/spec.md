## Purpose

Define release-type-aware coverage gates so emergency hotfixes can move faster while preserving deterministic risk handling and compatibility of the public evaluation contract.

## ADDED Requirements

### Requirement: Coverage thresholds depend on release type
The policy MUST evaluate coverage using thresholds specific to the submitted `releaseType`.

#### Scenario: Standard release below 70 is blocked
- **WHEN** `releaseType` is `standard` and `coverage` is below 70
- **THEN** the decision MUST be `NO_GO`
- **AND** reasons MUST include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Standard release in 70-79.99 requires review
- **WHEN** `releaseType` is `standard` and `coverage` is at least 70 and below 80
- **THEN** the decision MUST be `REVIEW` when no stronger blocking reason exists
- **AND** reasons MUST include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Hotfix release below 65 is blocked
- **WHEN** `releaseType` is `hotfix` and `coverage` is below 65
- **THEN** the decision MUST be `NO_GO`
- **AND** reasons MUST include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Hotfix release in 65-79.99 requires review
- **WHEN** `releaseType` is `hotfix` and `coverage` is at least 65 and below 80
- **THEN** the decision MUST be `REVIEW` when no stronger blocking reason exists
- **AND** reasons MUST include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Coverage at or above 80 does not restrict either release type
- **WHEN** `coverage` is at least 80 for `standard` or `hotfix`
- **THEN** coverage MUST NOT add any blocking or review reason by itself

### Requirement: Existing non-coverage risk rules remain unchanged
The policy MUST preserve previously established rules for test failures, vulnerabilities, and lint signals.

#### Scenario: Mandatory test failures block release
- **WHEN** `tests.failed` is greater than 0
- **THEN** the decision MUST be `NO_GO`
- **AND** reasons MUST include `MANDATORY_TEST_FAILURE`

#### Scenario: Critical vulnerability blocks release
- **WHEN** `security.critical` is greater than 0
- **THEN** the decision MUST be `NO_GO`
- **AND** reasons MUST include `CRITICAL_SECURITY_VULNERABILITY`

#### Scenario: High vulnerabilities at threshold require review
- **WHEN** `security.high` is at least 3 and no blocking reason is present
- **THEN** the decision MUST be `REVIEW`
- **AND** reasons MUST include `HIGH_SECURITY_RISK`

#### Scenario: Lint errors require review
- **WHEN** `lintErrors` is greater than 0 and no blocking reason is present
- **THEN** the decision MUST be `REVIEW`
- **AND** reasons MUST include `LINT_ERRORS`

### Requirement: Decision precedence and reason ordering stay deterministic
The evaluator MUST preserve deterministic precedence and reason ordering for all applicable rules.

#### Scenario: Blocking reasons override review reasons
- **WHEN** both blocking and review reasons apply to the same evidence
- **THEN** the final decision MUST be `NO_GO`

#### Scenario: Canonical hotfix acceptance behavior
- **WHEN** evidence matches the canonical `hotfix-release` scenario (`releaseType: hotfix`, `coverage: 67`, healthy tests, no critical vulnerabilities, and no lint errors)
- **THEN** the decision MUST be `REVIEW`
- **AND** a `standard` release with the same coverage MUST evaluate to `NO_GO`
