## Purpose

Permitir thresholds de cobertura específicos para `hotfix`, mantendo contrato público e precedência de decisão, para reduzir bloqueios indevidos em correções urgentes.

## ADDED Requirements

### Requirement: Coverage thresholds SHALL be selected by release type
The policy engine SHALL derive coverage-based decision bands from `releaseType`, using the `standard` thresholds as baseline and a dedicated `hotfix` minimum threshold.

#### Scenario: Standard release keeps existing baseline threshold
- **WHEN** evidence has `releaseType = "standard"`, `coverage = 67`, and no other decision signals
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** `reasons` MUST include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Hotfix release below hotfix minimum is NO_GO
- **WHEN** evidence has `releaseType = "hotfix"`, `coverage = 64.9`, and no other decision signals
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** `reasons` MUST include `COVERAGE_BELOW_MINIMUM`

### Requirement: Hotfix coverage mid band SHALL produce REVIEW
For `releaseType = "hotfix"`, the policy engine SHALL return `REVIEW` when `coverage >= 65` and `< 80`, unless a higher-precedence blocker applies.

#### Scenario: Hotfix lower boundary returns REVIEW
- **WHEN** evidence has `releaseType = "hotfix"`, `coverage = 65`, and no blocker signals
- **THEN** the evaluation decision MUST be `REVIEW`
- **AND** `reasons` MUST NOT include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Hotfix canon scenario returns REVIEW
- **WHEN** evidence matches the simulator scenario `hotfix-release` (`releaseType = "hotfix"`, `coverage = 67`, healthy remaining signals)
- **THEN** the evaluation decision MUST be `REVIEW`

#### Scenario: Hotfix upper boundary returns GO
- **WHEN** evidence has `releaseType = "hotfix"`, `coverage = 80`, and no blocker or review-only signals
- **THEN** the evaluation decision MUST be `GO`

### Requirement: Existing precedence and reason ordering SHALL remain stable
The engine SHALL preserve decision precedence (`NO_GO > REVIEW > GO`) and canonical reason order from `REASON_CODES` for all release types.

#### Scenario: Blocker still overrides hotfix review band
- **WHEN** evidence has `releaseType = "hotfix"`, `coverage = 67`, and `tests.failed > 0`
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** `reasons` MUST include `MANDATORY_TEST_FAILURE` in canonical position order

#### Scenario: Multi-signal result keeps canonical reason order
- **WHEN** evidence has `releaseType = "hotfix"`, `coverage = 60`, `tests.failed > 0`, `security.critical > 0`, and `lintErrors > 0`
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** `reasons` MUST be ordered as `["COVERAGE_BELOW_MINIMUM", "MANDATORY_TEST_FAILURE", "CRITICAL_SECURITY_VULNERABILITY", "LINT_ERRORS"]`

### Requirement: Seed aggregates SHALL include hotfix threshold migration
Startup seed re-evaluation SHALL reflect the hotfix threshold update without changing the deterministic seed set.

#### Scenario: Hotfix seed item migrates from NO_GO to REVIEW
- **WHEN** seeded evidence `EV-0018` (`releaseType = "hotfix"`, `coverage = 67`, healthy remaining signals) is evaluated under this policy
- **THEN** its decision MUST be `REVIEW`
- **AND** aggregate `byDecision` MUST increment `REVIEW` and decrement `NO_GO` by one versus the previous policy baseline
