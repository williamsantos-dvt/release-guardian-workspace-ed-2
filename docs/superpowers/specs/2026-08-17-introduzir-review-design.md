# Design - Introduzir REVIEW na policy de release

## Contexto

O Release Guardian recebe evidencias de pipeline e devolve uma decisao auditavel.
Hoje, a engine em `apps/api/src/services/releaseService.ts` devolve apenas `GO` ou `NO_GO`.
O contrato publico em `packages/contracts/src/index.ts` ja suporta `GO | REVIEW | NO_GO`.

Objetivo deste design: introduzir `REVIEW` como gate manual obrigatorio sem alterar o contrato HTTP.

## Decisoes fechadas

1. `REVIEW` e gate manual obrigatorio antes de deploy.
2. `REVIEW` acontece apenas em casos de cobertura baixa moderada.
3. `hotfix` e mais rigoroso que `standard`.
4. `security.high > 0` sempre resulta em `NO_GO`.
5. Manter poucos reason codes fortes e adicionar `HIGH_SECURITY_RISK`.
6. Abordagem escolhida: faixas por tipo (`standard` e `hotfix`) + precedencia de bloqueios duros.

## Modelo de decisao

### 1) Bloqueios duros (precedencia maxima)

Se qualquer regra abaixo for verdadeira, decisao final e `NO_GO`:

- `tests.failed > 0` -> `MANDATORY_TEST_FAILURE`
- `security.critical > 0` -> `CRITICAL_SECURITY_VULNERABILITY`
- `security.high > 0` -> `HIGH_SECURITY_RISK`
- `lintErrors > 0` -> `LINT_ERRORS`

### 2) Cobertura (apenas se nao houver bloqueios duros)

Aplicar thresholds por `releaseType`:

- `standard`
  - `coverage >= STANDARD_GO_MIN` -> `GO`
  - `STANDARD_REVIEW_MIN <= coverage < STANDARD_GO_MIN` -> `REVIEW`
  - `coverage < STANDARD_REVIEW_MIN` -> `NO_GO`
- `hotfix` (mais rigoroso)
  - `coverage >= HOTFIX_GO_MIN` -> `GO`
  - `HOTFIX_REVIEW_MIN <= coverage < HOTFIX_GO_MIN` -> `REVIEW`
  - `coverage < HOTFIX_REVIEW_MIN` -> `NO_GO`

Invariantes:

- `0 <= REVIEW_MIN < GO_MIN <= 100` por tipo.
- `HOTFIX_REVIEW_MIN >= STANDARD_REVIEW_MIN`.
- `HOTFIX_GO_MIN >= STANDARD_GO_MIN`.

### 3) Razoes e ordem canonica

Ordem estavel proposta para `reasons`:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `HIGH_SECURITY_RISK`
5. `LINT_ERRORS`

Regras de emissao:

- Em `REVIEW`, `reasons` deve conter apenas `COVERAGE_BELOW_MINIMUM`.
- Em `NO_GO` por cobertura extrema sem outros bloqueios, manter `COVERAGE_BELOW_MINIMUM` (sem reason code novo).
- Em `NO_GO` por bloqueio duro, incluir os respectivos codigos.

## Impacto por componente

### Policy engine

- Atualizar logica em `apps/api/src/services/releaseService.ts` para emitir `REVIEW`.
- Ajustar tipo de retorno local para `GO | REVIEW | NO_GO`.
- Introduzir validacao de `security.high` com `HIGH_SECURITY_RISK`.

### Contratos

- `Decision` ja suporta `REVIEW`; manter shape de request/response.
- Atualizar `REASON_CODES` em `packages/contracts/src/index.ts` para incluir `HIGH_SECURITY_RISK`.

### API e repositorio

- Rotas e repositorio devem continuar com mesmo shape HTTP.
- Persistencia em memoria permanece; sem mudanca de infraestrutura.

### Observabilidade

- `GET /api/v1/statistics` passa a refletir casos reais em `REVIEW`.
- Dashboard e simulador devem continuar funcionando sem alteracoes estruturais.

## Tratamento de erros e compatibilidade

- Sem mudanca de status codes HTTP (`201` sucesso, `400` payload invalido).
- Sem mudanca de schema de entrada.
- Sem mudanca no formato de `EvaluateResponse`.

## Estrategia de testes

### Unitarios (policy)

- Cobrir 3 faixas de cobertura para `standard` e `hotfix`.
- Garantir `security.high > 0` => `NO_GO` com `HIGH_SECURITY_RISK`.
- Garantir precedencia dos bloqueios duros sobre cobertura.
- Garantir ordem estavel de `reasons`.

### API

- `POST /api/v1/evaluations` com cobertura baixa moderada e sem blockers -> `REVIEW`.
- Evidencia com `security.high > 0` -> `NO_GO`.
- `GET /api/v1/statistics` inclui contagem de `REVIEW` quando aplicavel.

### Validacao integrada

- Manter `npm run validate` verde (typecheck, lint, testes, coverage, smoke).
- Confirmar smoke funcional preserva contrato HTTP e historico seed.

## Escopo e nao objetivos

Dentro do escopo:

- Evolucao de policy para suportar `REVIEW`.
- Regras de cobertura por tipo (`standard` e `hotfix`).
- Novo reason code `HIGH_SECURITY_RISK`.

Fora do escopo:

- Alterar dashboard como area primaria de implementacao.
- Alterar simulador como area primaria de implementacao.
- Introduzir persistencia externa, Docker, ou novas dependencias sem justificacao forte.
