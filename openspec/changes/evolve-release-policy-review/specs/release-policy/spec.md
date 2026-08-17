## Purpose

Define release-policy decision semantics that explicitly support review outcomes while preserving the frozen HTTP contract and auditability of decision reasons.

## ADDED Requirements

### Requirement: Decision precedence and rule evaluation
The system MUST evaluate release evidence using these policy rules: critical vulnerabilities, failed mandatory tests, lint errors, and coverage below minimum are blocking rules; high security risk without critical vulnerability is a review rule. The final decision MUST follow precedence `NO_GO > REVIEW > GO`.

#### Scenario: Blocking reasons dominate review reasons
- **WHEN** evidence contains at least one blocking condition and also contains review-eligible high risk data
- **THEN** the final decision is `NO_GO`

#### Scenario: Review decision is emitted when only review rule fires
- **WHEN** `security.high > 0`, `security.critical = 0`, and no blocking condition is present
- **THEN** the final decision is `REVIEW`

#### Scenario: Go decision is emitted when no rule fires
- **WHEN** all blocking and review rule conditions are false
- **THEN** the final decision is `GO`

### Requirement: Coverage threshold source of truth
The system MUST evaluate coverage using `MINIMUM_COVERAGE` as the policy threshold source and MUST NOT rely on a numeric coverage literal in decision logic.

#### Scenario: Coverage exactly at threshold
- **WHEN** `coverage = MINIMUM_COVERAGE` and no other rule condition is true
- **THEN** no coverage reason is emitted and coverage does not block release

#### Scenario: Coverage below threshold
- **WHEN** `coverage < MINIMUM_COVERAGE`
- **THEN** the reason `COVERAGE_BELOW_MINIMUM` is emitted and contributes to a `NO_GO` decision

### Requirement: Canonical reason set and ordering
The system MUST emit reasons using this canonical order: `COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `HIGH_SECURITY_RISK`, `LINT_ERRORS`.

#### Scenario: Blocking case reason order
- **WHEN** `coverage < MINIMUM_COVERAGE`, `tests.failed > 0`, `security.critical > 0`, and `lintErrors > 0`
- **THEN** decision is `NO_GO` and reasons are exactly `['COVERAGE_BELOW_MINIMUM','MANDATORY_TEST_FAILURE','CRITICAL_SECURITY_VULNERABILITY','LINT_ERRORS']`

#### Scenario: Review case reason value
- **WHEN** `security.high > 0`, `security.critical = 0`, and no blocking condition is true
- **THEN** decision is `REVIEW` and reasons are exactly `['HIGH_SECURITY_RISK']`

#### Scenario: Mutual exclusion of high-risk reason under critical vulnerability
- **WHEN** `security.critical > 0` and `security.high > 0`
- **THEN** decision is `NO_GO` and reasons do not contain `HIGH_SECURITY_RISK`

### Requirement: Blocking reason aggregation in statistics
The system MUST count top blocking reasons only from evaluations with decision `NO_GO`. Evaluations with decision `REVIEW` MUST contribute to `byDecision.REVIEW` but MUST NOT contribute to `topBlockingReasons`.

#### Scenario: Review evaluations are excluded from blocking reason counts
- **WHEN** seeded or runtime evaluations include entries with `decision = REVIEW`
- **THEN** those entries increase `byDecision.REVIEW` and do not increment `topBlockingReasons`

#### Scenario: Seeded history reflects evolved policy
- **WHEN** the service starts with the baseline seed set and this policy is active
- **THEN** statistics report `byDecision = { GO: 8, REVIEW: 5, NO_GO: 5 }`
