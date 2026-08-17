## ADDED Requirements

### Requirement: Revisão para risco de segurança alto
O sistema DEVERÁ devolver `REVIEW` quando a evidência revela vulnerabilidades `high` mas nenhuma `critical`.

#### Scenario: Vulnerabilidade high sem critical
- **QUANDO** `security.critical = 0` e `security.high > 0`
- **ENTÃO** a decisão é `REVIEW`
- **E** a razão `HIGH_SECURITY_RISK` faz parte do array `reasons`

### Requirement: Revisão para cobertura intermédia
O sistema DEVERÁ devolver `REVIEW` para releases com cobertura entre o mínimo técnico e o alvo desejado (ex.: 70–84). Esse intervalo pode ser ajustado conforme a decisão da análise das três fontes.

#### Scenario: Cobertura abaixo do alvo mas acima do mínimo
- **QUANDO** `coverage` está em `[MINIMUM_COVERAGE, TARGET_COVERAGE)`
- **E** não há `tests.failed` nem `lintErrors`
- **E** `security.critical = 0`
- **ENTÃO** a decisão é `REVIEW`
- **E** a razão `COVERAGE_NEEDS_REVIEW` aparece em `reasons`

### Requirement: GO para evidência saudável
O sistema DEVERÁ devolver `GO` quando cobertura, testes, lint e segurança não acionam decisões de revisão ou bloqueio.

#### Scenario: Todos os critérios estão dentro do ideal
- **QUANDO** `coverage >= TARGET_COVERAGE`
- **E** `tests.failed = 0`, `lintErrors = 0`, `security.critical = 0`, `security.high = 0`
- **ENTÃO** a decisão é `GO`
- **E** `reasons` é um array vazio

### Requirement: NO_GO para violação crítica
Os critérios blocantes existentes mantêm-se. `REVIEW` nunca se aplica quando as condições bloqueantes estão presentes.

#### Scenario: Vulnerabilidade crítica
- **QUANDO** `security.critical > 0`
- **ENTÃO** a decisão é `NO_GO`
- **E** `CRITICAL_SECURITY_VULNERABILITY` está em `reasons`

#### Scenario: Testes falhados
- **QUANDO** `tests.failed > 0`
- **ENTÃO** a decisão é `NO_GO`
- **E** `MANDATORY_TEST_FAILURE` está em `reasons`

## MODIFIED Requirements

### Requirement: Ordem e prioridade das razões
As razões são devolvidas nesta ordem exata e determinam o veredito final:

1. `COVERAGE_BELOW_MINIMUM` → sempre `NO_GO`
2. `MANDATORY_TEST_FAILURE` → sempre `NO_GO`
3. `CRITICAL_SECURITY_VULNERABILITY` → sempre `NO_GO`
4. `HIGH_SECURITY_RISK` → `REVIEW` se não houver bloqueios
5. `COVERAGE_NEEDS_REVIEW` → `REVIEW` se não houver bloqueios
6. `LINT_ERRORS` → `NO_GO`

Se nenhuma razão estiver presente, a decisão é `GO`.

### Requirement: Coverage como âncora
A discrepância entre o que os docs dizem (75) e a implementação/testes (70) deve ser resolvida por documentação da OpenSpec: o valor final usado no código precisa estar documentado aqui, justificando a escolha (ex.: manter 70 como mínimo técnico e adicionar `COVERAGE_NEEDS_REVIEW` para [70, TARGET)).
