## Purpose

Atualizar a capability `release-policy` para suportar thresholds de cobertura por tipo de release e severidade dinamica por razao, mantendo contrato HTTP congelado e auditabilidade de decisoes.

## MODIFIED Requirements

### Requirement: Cobertura por tipo de release com severidade dinamica
O sistema MUST avaliar cobertura por `releaseType` e atribuir severidade a `COVERAGE_BELOW_MINIMUM` da seguinte forma:

- `standard`: `< 70 => NO_GO`, `70..79.99 => REVIEW`, `>= 80 => sem razao de cobertura`.
- `hotfix`: `< 65 => NO_GO`, `65..79.99 => REVIEW`, `>= 80 => sem razao de cobertura`.

#### Scenario: Fronteiras de coverage para standard
- **WHEN** `releaseType = standard` e nao existem outras regras aplicaveis
- **THEN** `coverage = 69.99` resulta em `NO_GO`
- **AND** `coverage = 70` resulta em `REVIEW`
- **AND** `coverage = 79.99` resulta em `REVIEW`
- **AND** `coverage = 80` resulta em `GO`

#### Scenario: Fronteiras de coverage para hotfix
- **WHEN** `releaseType = hotfix` e nao existem outras regras aplicaveis
- **THEN** `coverage = 64.99` resulta em `NO_GO`
- **AND** `coverage = 65` resulta em `REVIEW`
- **AND** `coverage = 67` resulta em `REVIEW`
- **AND** `coverage = 80` resulta em `GO`

#### Scenario: Cenario canon do CR-01
- **WHEN** `releaseType = hotfix`, `coverage = 67`, `tests.failed = 0`, `security.critical = 0`, `security.high = 0`, `lintErrors = 0`
- **THEN** a decisao final e `REVIEW`
- **AND** as razoes sao exatamente `['COVERAGE_BELOW_MINIMUM']`

### Requirement: Regras de seguranca, testes e lint
O sistema MUST aplicar as regras abaixo:

- `security.critical > 0` emite `CRITICAL_SECURITY_VULNERABILITY` com severidade `NO_GO`.
- `tests.failed > 0` emite `MANDATORY_TEST_FAILURE` com severidade `NO_GO`.
- `security.high >= 3` emite `HIGH_SECURITY_RISK` com severidade `REVIEW`.
- `lintErrors > 0` emite `LINT_ERRORS` com severidade `REVIEW`.

#### Scenario: Limiar de high security
- **WHEN** nao ha outras regras aplicaveis e `security.critical = 0`
- **THEN** `security.high = 2` nao emite `HIGH_SECURITY_RISK` e nao influencia a decisao
- **AND** `security.high = 3` emite `HIGH_SECURITY_RISK` e resulta em `REVIEW`

#### Scenario: Lint isolado e review
- **WHEN** `coverage >= 80`, `tests.failed = 0`, `security.critical = 0`, `security.high < 3`, `lintErrors = 1`
- **THEN** a decisao final e `REVIEW`
- **AND** as razoes sao exatamente `['LINT_ERRORS']`

#### Scenario: Critical domina mesmo com coverage saudavel
- **WHEN** `coverage = 85` e `security.critical = 1`
- **THEN** a decisao final e `NO_GO`
- **AND** as razoes incluem `CRITICAL_SECURITY_VULNERABILITY`

### Requirement: Precedencia de decisao e ordem canonica de razoes
A decisao final MUST seguir precedencia `NO_GO > REVIEW > GO`. O sistema MUST devolver todas as razoes aplicaveis na ordem canonica existente:
`COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `HIGH_SECURITY_RISK`, `LINT_ERRORS`.

#### Scenario: Razoes mistas com precedencia NO_GO
- **WHEN** existem razoes de `NO_GO` e de `REVIEW` simultaneamente
- **THEN** a decisao final e `NO_GO`
- **AND** as razoes sao devolvidas pela ordem canonica

### Requirement: Seeds reavaliadas refletem a policy CR-01
Ao arrancar com os 18 seeds atuais, o sistema MUST reavaliar com esta policy e expor os totais esperados.

#### Scenario: byDecision esperado para os 18 seeds
- **WHEN** o servico arranca com `apps/api/src/seeds/seedData.ts`
- **THEN** `byDecision` e exatamente `{ GO: 10, REVIEW: 4, NO_GO: 4 }`
