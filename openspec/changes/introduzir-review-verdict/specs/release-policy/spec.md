## ADDED Requirements

### Requirement: Veredito REVIEW para risco intermediario
O sistema DEVERA emitir `REVIEW` quando uma release tiver vulnerabilidades
`high`, sem qualquer condicao de bloqueio.

#### Scenario: High sem blockers
- **DADO** `coverage >= 70`
- **E** `tests.failed = 0`
- **E** `security.critical = 0`
- **E** `security.high > 0`
- **E** `lintErrors = 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `REVIEW`

### Requirement: Prioridade de bloqueio sobre review
Qualquer condicao de bloqueio DEVERA prevalecer sobre `REVIEW`.

#### Scenario: High com cobertura abaixo do minimo
- **DADO** `coverage < 70`
- **E** `security.high > 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `COVERAGE_BELOW_MINIMUM`

#### Scenario: High com vulnerabilidade critical
- **DADO** `security.critical > 0`
- **E** `security.high > 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `CRITICAL_SECURITY_VULNERABILITY`

### Requirement: Manter bloqueios existentes
O sistema DEVERA manter as regras de bloqueio da policy baseline.

#### Scenario: Cobertura abaixo do minimo
- **DADO** `coverage < 70`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `COVERAGE_BELOW_MINIMUM`

#### Scenario: Testes mandatorios falhados
- **DADO** `tests.failed > 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `MANDATORY_TEST_FAILURE`

#### Scenario: Vulnerabilidade critical
- **DADO** `security.critical > 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `CRITICAL_SECURITY_VULNERABILITY`

#### Scenario: Erros de lint
- **DADO** `lintErrors > 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `NO_GO`
- **E** `reasons` contem `LINT_ERRORS`

### Requirement: GO para release sem riscos
O sistema DEVERA emitir `GO` quando nao existir condicao de bloqueio nem
condicao de review.

#### Scenario: Release saudavel
- **DADO** `coverage >= 70`
- **E** `tests.failed = 0`
- **E** `security.critical = 0`
- **E** `security.high = 0`
- **E** `lintErrors = 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** a decisao e `GO`
- **E** `reasons` e `[]`

### Requirement: Ordem estavel das razoes de bloqueio
Quando multiplas condicoes de bloqueio se aplicarem, as razoes DEVERAO manter a
ordem canonica.

#### Scenario: Multiplos blockers
- **DADO** `coverage < 70`
- **E** `tests.failed > 0`
- **E** `security.critical > 0`
- **E** `lintErrors > 0`
- **QUANDO** a evidencia e avaliada
- **ENTAO** `reasons` e exatamente:
  1. `COVERAGE_BELOW_MINIMUM`
  2. `MANDATORY_TEST_FAILURE`
  3. `CRITICAL_SECURITY_VULNERABILITY`
  4. `LINT_ERRORS`

### Requirement: Contrato HTTP inalterado
A evolucao da policy NAO DEVERA alterar o shape do contrato de
`POST /api/v1/evaluations`.

#### Scenario: Shape da resposta preservado
- **DADO** uma avaliacao bem-sucedida
- **QUANDO** a API responde
- **ENTAO** o corpo contem os campos `evaluationId`, `releaseId`, `decision`,
  `reasons`, `policyVersion`, `evaluatedAt`
- **E** `decision` permanece dentro de `GO | REVIEW | NO_GO`
