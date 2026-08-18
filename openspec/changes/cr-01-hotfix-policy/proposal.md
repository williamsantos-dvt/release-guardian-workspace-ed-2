## Why

O motor atual trata cobertura de `standard` e `hotfix` com o mesmo limiar e usa classificacao estatica de razoes (bloqueante vs revisao). O CR-01 exige policy por tipo de release e muda severidades de regras existentes (`high` e `lint`), mantendo contrato HTTP congelado.

## What Changes

- Introduzir thresholds de cobertura por tipo de release:
  - `standard`: `<70 => NO_GO`, `70..79.99 => REVIEW`, `>=80 => sem razao de cobertura`.
  - `hotfix`: `<65 => NO_GO`, `65..79.99 => REVIEW`, `>=80 => sem razao de cobertura`.
- Manter `COVERAGE_BELOW_MINIMUM` como codigo unico de razao para cobertura, com severidade dinamica conforme tipo + valor.
- Atualizar regras nao-cobertura:
  - `security.critical > 0 => NO_GO` com `CRITICAL_SECURITY_VULNERABILITY`.
  - `tests.failed > 0 => NO_GO` com `MANDATORY_TEST_FAILURE`.
  - `security.high >= 3 => REVIEW` com `HIGH_SECURITY_RISK` (antes: `high > 0`).
  - `lintErrors > 0 => REVIEW` com `LINT_ERRORS` (antes: bloqueante).
- Preservar precedencia `NO_GO > REVIEW > GO` e ordem canonica de razoes inalterada.
- Substituir `MINIMUM_COVERAGE` unico por constantes por tipo de release no dominio de policy (sem alterar shape de API).

## Capabilities

### Modified Capabilities
- `release-policy`: passa a suportar severidade dinamica de cobertura por tipo de release, com decisao final derivada da severidade maxima entre razoes aplicaveis.

## Impact

- Areas de implementacao afetadas (planeadas):
  - `apps/api/src/services/releaseService.ts`
  - `apps/api/src/constants.ts`
  - `apps/api/test/policy.test.ts`
  - `apps/api/test/api.test.ts`
- Sem alteracoes de contrato para `POST /api/v1/evaluations` e sem alteracoes em `apps/dashboard/`, `scripts/` ou `examples/`.

### Seed impact esperado (18 seeds)

Decisao esperada por `releaseId` sob a policy alvo:

| releaseId | decision |
|---|---|
| checkout-api-4.8.2 | GO |
| portal-web-3.6.1 | GO |
| billing-svc-2.2.0 | GO |
| auth-api-5.0.1 | GO |
| search-svc-1.9.3 | GO |
| notifications-2.4.0 | GO |
| api-gw-6.1.0 | GO |
| ml-inference-0.9.2 | GO |
| mobile-bff-3.3.1 | GO |
| reporting-svc-4.0.0 | GO |
| payments-api-8.2.0 | REVIEW |
| inventory-svc-2.7.4 | REVIEW |
| crm-sync-1.4.9 | REVIEW |
| legacy-cron-1.0.7 | NO_GO |
| checkout-api-4.8.1 | NO_GO |
| payments-api-8.1.0 | NO_GO |
| docs-portal-0.3.0 | NO_GO |
| emergency-fix-221 | REVIEW |

Total esperado em `byDecision`:

- `GO: 10`
- `REVIEW: 4`
- `NO_GO: 4`

## Acceptance Criteria

- Fronteiras de cobertura `standard`: `69.99 => NO_GO`, `70 => REVIEW`, `79.99 => REVIEW`, `80 => GO`.
- Fronteiras de cobertura `hotfix`: `64.99 => NO_GO`, `65 => REVIEW`, `67 => REVIEW`, `80 => GO`.
- `security.high = 2` nao gera razao; `security.high = 3` gera `REVIEW` com `HIGH_SECURITY_RISK`.
- `lintErrors = 1` com cobertura `>= 80` gera `REVIEW` com `LINT_ERRORS`.
- `security.critical = 1` com cobertura `85` gera `NO_GO` com `CRITICAL_SECURITY_VULNERABILITY`.
- Cenario do CR: `hotfix` com cobertura `67` e restantes sinais saudaveis resulta em `REVIEW`.

## Existing tests expected to fail (before updates)

- `apps/api/test/policy.test.ts:30` (`returns REVIEW when only high security risk is present`): hoje assume `high = 1 => REVIEW`; sob nova policy passa a `GO`. **Classificacao:** codifica comportamento antigo.
- `apps/api/test/policy.test.ts:64` (`returns exact review reason for high risk without critical`): hoje assume `high = 2` gera `HIGH_SECURITY_RISK`; sob nova policy nao gera razao. **Classificacao:** codifica comportamento antigo.
- `apps/api/test/policy.test.ts:70` (`does not include HIGH_SECURITY_RISK when critical vulnerability exists`): hoje assume exclusao de `HIGH` quando `critical > 0`; sob nova policy, razoes aplicaveis devem ser devolvidas em ordem canonica. **Classificacao:** codifica comportamento antigo.
- `apps/api/test/policy.test.ts:89` (`blocks lint errors`): hoje assume `lintErrors > 0 => NO_GO`; sob nova policy passa a `REVIEW`. **Classificacao:** codifica comportamento antigo.
- `apps/api/test/api.test.ts:103` (agregado `byDecision`): hoje espera `{ GO: 8, REVIEW: 5, NO_GO: 5 }`; sob nova policy esperado `{ GO: 10, REVIEW: 4, NO_GO: 4 }`. **Classificacao:** codifica comportamento antigo.
- `apps/api/test/api.test.ts:104` (`topBlockingReasons`): contagens e composicao mudam devido nova classificacao de `high`/`lint` e novo balanço de decisoes. **Classificacao:** codifica comportamento antigo.

## Non-goals

- Nao alterar shape de request/response nem JSON Schemas do contrato HTTP.
- Nao introduzir novos endpoints, persistencia externa, base de dados, Docker ou dependencias.
- Nao alterar `apps/dashboard/`, `scripts/` nem `examples/`.
- Nao tratar temas fora desta policy (ex.: refactors gerais de arquitetura, paginacao, ou mudancas de UX).
