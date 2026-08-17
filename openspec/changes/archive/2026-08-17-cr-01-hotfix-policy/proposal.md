## Why

O CR-01 exige política diferenciada para hotfix: reduzir bloqueios de cobertura em incidentes sem quebrar contrato HTTP. A política atual implementada está mais rígida do que o pedido do CR-01 para hotfix e para sinais de risco/lint.

## What Changes

- Ajustar thresholds de cobertura por tipo para o modelo do CR-01.
- Manter `tests.failed > 0` e `security.critical > 0` como `NO_GO`.
- Reclassificar `security.high >= 3` para `REVIEW` (em vez de bloqueio duro).
- Reclassificar `lintErrors > 0` para `REVIEW` (em vez de bloqueio duro).
- Definir precedência final `NO_GO > REVIEW > GO` com reasons em ordem canônica.
- Confirmar `GET /api/v1/policy.minimumCoverage = 70` (decisão alinhada com "mínimo" para `standard`).

## Capabilities

### New Capabilities
- None.

### Modified Capabilities
- `release-policy`: Atualiza regras de decisão para CR-01 (thresholds por tipo, semântica de `high`/`lint`, e comportamento esperado do cenário `hotfix-release`).

## Impact

- Código afetado: `apps/api/src/services/releaseService.ts`, `apps/api/src/constants.ts`.
- Testes afetados: `apps/api/test/policy.test.ts`, `apps/api/test/api.test.ts`.
- Documentação afetada: `docs/release-policy.md` e coerência com `docs/change-requests/cr-01-hotfix-policy.md`.
- Compatibilidade: sem novos endpoints, sem mudança de shape HTTP, sem nova persistência, sem mudança de UI.
