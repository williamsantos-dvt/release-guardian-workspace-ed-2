## Purpose

Definir um veredito intermédio auditável para releases com cobertura aceitável, sem alterar o contrato público de avaliação nem a ordem canónica dos reason codes.

## ADDED Requirements

### Requirement: Coverage band drives the baseline decision
The policy engine SHALL derive a baseline decision from `coverage` using these thresholds: `NO_GO` when coverage is below 70, `REVIEW` when coverage is greater than or equal to 70 and below 80, and `GO` when coverage is greater than or equal to 80.

#### Scenario: Coverage below minimum yields NO_GO
- **WHEN** evidence has `coverage = 69.9` and no other blocking signals (`tests.failed = 0`, `security.critical = 0`, `lintErrors = 0`)
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** `reasons` MUST include `COVERAGE_BELOW_MINIMUM` (canonical position 1 in `REASON_CODES`)

#### Scenario: Coverage at lower boundary yields REVIEW
- **WHEN** evidence has `coverage = 70` and no other blocking signals (`tests.failed = 0`, `security.critical = 0`, `lintErrors = 0`)
- **THEN** the evaluation decision MUST be `REVIEW`
- **AND** `reasons` MUST NOT include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Coverage just below upper boundary yields REVIEW
- **WHEN** evidence has `coverage = 79.9` and no other blocking signals (`tests.failed = 0`, `security.critical = 0`, `lintErrors = 0`)
- **THEN** the evaluation decision MUST be `REVIEW`
- **AND** `reasons` MUST NOT include `COVERAGE_BELOW_MINIMUM`

#### Scenario: Coverage at upper boundary yields GO
- **WHEN** evidence has `coverage = 80` and no other blocking signals (`tests.failed = 0`, `security.critical = 0`, `lintErrors = 0`)
- **THEN** the evaluation decision MUST be `GO`
- **AND** `reasons` MUST be empty

### Requirement: Existing blocking reasons remain blocking
The policy engine SHALL keep current blocking semantics for non-coverage checks: any failed mandatory test, any critical security vulnerability, or any lint error MUST force decision `NO_GO` regardless of coverage band.

#### Scenario: Failed tests override REVIEW coverage band
- **WHEN** evidence has `coverage = 75` and `tests.failed > 0`
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** `reasons` MUST include `MANDATORY_TEST_FAILURE` (canonical position 2 in `REASON_CODES`)

#### Scenario: Critical vulnerability overrides GO coverage band
- **WHEN** evidence has `coverage = 85` and `security.critical > 0`
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** `reasons` MUST include `CRITICAL_SECURITY_VULNERABILITY` (canonical position 3 in `REASON_CODES`)

#### Scenario: Lint errors override REVIEW coverage band
- **WHEN** evidence has `coverage = 74` and `lintErrors > 0`
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** `reasons` MUST include `LINT_ERRORS` (canonical position 4 in `REASON_CODES`)

### Requirement: Reasons preserve canonical ordering
When multiple reasons apply, the response SHALL keep `reasons` in the canonical `REASON_CODES` order: `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `LINT_ERRORS`.

#### Scenario: Multi-signal NO_GO returns ordered reasons
- **WHEN** evidence has `coverage = 63`, `tests.failed > 0`, `security.critical > 0`, and `lintErrors > 0`
- **THEN** the evaluation decision MUST be `NO_GO`
- **AND** `reasons` MUST be exactly `["COVERAGE_BELOW_MINIMUM", "MANDATORY_TEST_FAILURE", "CRITICAL_SECURITY_VULNERABILITY", "LINT_ERRORS"]`

### Requirement: Seed aggregates reflect threshold migration
On startup seed re-evaluation, the by-decision aggregate SHALL reflect the new coverage thresholds and unchanged non-coverage blockers.

#### Scenario: Seed byDecision shifts from baseline distribution
- **WHEN** the repository initializes the 18 deterministic seed evidences under this policy
- **THEN** `byDecision` MUST be `{ GO: 10, REVIEW: 3, NO_GO: 5 }`
- **AND** the moved evaluations MUST be the coverage-only cases in the 70–79.9 range (`EV-0011`, `EV-0012`, `EV-0013`) transitioning from `GO` to `REVIEW`
