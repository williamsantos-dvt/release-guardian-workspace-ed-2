## MODIFIED Requirements

### Requirement: Coverage por tipo de release
O sistema DEVERA aplicar thresholds de cobertura distintos para `standard` e
`hotfix`.

#### Scenario: Standard abaixo do minimo
- **DADO** uma release `standard` com `coverage < 70`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `COVERAGE_BELOW_MINIMUM`

#### Scenario: Standard em faixa de review
- **DADO** uma release `standard` com `70 <= coverage < 80`
- **E** sem falhas de testes, critical ou lint
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `REVIEW`

#### Scenario: Hotfix abaixo do minimo
- **DADO** uma release `hotfix` com `coverage < 65`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `COVERAGE_BELOW_MINIMUM`

#### Scenario: Hotfix em faixa de review
- **DADO** uma release `hotfix` com `65 <= coverage < 80`
- **E** sem falhas de testes, critical ou lint
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `REVIEW`

### Requirement: Regras de bloqueio mantidas
Falhas de testes e vulnerabilidades critical continuam a bloquear release.

#### Scenario: Falhas de testes bloqueiam
- **DADO** `tests.failed > 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `MANDATORY_TEST_FAILURE`

#### Scenario: Critical bloqueia
- **DADO** `security.critical > 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `CRITICAL_SECURITY_VULNERABILITY`

### Requirement: Sinais de review sem bloqueio
Quando nao houver bloqueio, a policy DEVERA emitir `REVIEW` para sinais de
risco intermediario.

#### Scenario: High security no limiar de review
- **DADO** `security.high >= 3`
- **E** sem bloqueios de coverage, testes ou critical
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `REVIEW`

#### Scenario: Lint sem bloqueios
- **DADO** `lintErrors > 0`
- **E** sem bloqueios de coverage, testes ou critical
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `REVIEW`
- **E** `reasons` contem `LINT_ERRORS`

### Requirement: Precedencia de decisao
O sistema DEVERA manter precedencia `NO_GO > REVIEW > GO`.

#### Scenario: Sinais mistos com bloqueio
- **DADO** coverage em faixa de review
- **E** `security.high >= 3`
- **E** `tests.failed > 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`

### Requirement: Cenario canon hotfix-release
O cenario `hotfix-release` DEVERA refletir o comportamento pos-CR-01.

#### Scenario: Hotfix 67 com sinais saudaveis
- **DADO** `releaseType = hotfix`, `coverage = 67`, `tests.failed = 0`,
  `security.critical = 0`, `security.high < 3`, `lintErrors = 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `REVIEW`

### Requirement: Contrato principal inalterado
A evolucao da policy NAO DEVERA alterar o shape de `POST /api/v1/evaluations`.
