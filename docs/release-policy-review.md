# Release Policy Review - estado atual

## 1) Contexto

Este documento resume o estado da policy apos duas iteracoes:

1. introducao do veredito `REVIEW`;
2. aplicacao do change request `CR-01` para thresholds de cobertura por tipo de release.

Referencia do CR-01: `docs/change-requests/cr-01-hotfix-policy.md`.

## 2) Decisoes e precedencia

O motor devolve uma de tres decisoes:

- `NO_GO`
- `REVIEW`
- `GO`

Precedencia obrigatoria:

1. `NO_GO`
2. `REVIEW`
3. `GO`

## 3) Regras de bloqueio (`NO_GO`)

- Cobertura abaixo do minimo por tipo:
  - `standard`: `< 70` -> `COVERAGE_BELOW_MINIMUM`
  - `hotfix`: `< 65` -> `COVERAGE_BELOW_MINIMUM`
- `tests.failed > 0` -> `MANDATORY_TEST_FAILURE`
- `security.critical > 0` -> `CRITICAL_SECURITY_VULNERABILITY`

## 4) Regras de revisao (`REVIEW`) quando nao ha bloqueio

- Cobertura em faixa de revisao:
  - `standard`: `70 - 79.99`
  - `hotfix`: `65 - 79.99`
- `security.high >= 3`
- `lintErrors > 0` (com `LINT_ERRORS`)

## 5) Razoes e ordem

As razoes continuam na ordem canonica quando aplicaveis:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `LINT_ERRORS`

## 6) Contrato e restricoes

- O contrato HTTP de `POST /api/v1/evaluations` permanece congelado.
- Sem novos endpoints.
- Sem persistencia externa.
- Dashboard e simulador continuam apenas como consumidores da API.

## 7) Cenarios de referencia

- `npm run simulate:pipeline -- hotfix-release`
  - Hotfix com cobertura 67 e restantes sinais saudaveis -> `REVIEW`.
- Standard com a mesma cobertura (67) -> `NO_GO`.
