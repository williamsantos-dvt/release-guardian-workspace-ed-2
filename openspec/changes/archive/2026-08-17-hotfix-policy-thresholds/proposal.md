## Why

O motor atual trata `standard` e `hotfix` com o mesmo limiar de cobertura, o que mantém bloqueios desnecessários para correções urgentes de produção. O CR-01 exige thresholds por tipo de release para preservar segurança sem comprometer tempo de resposta a incidentes.

## What Changes

- Introduzir policy de cobertura parametrizada por `releaseType`, mantendo comportamento atual para `standard` e adicionando faixa própria para `hotfix`.
- Definir para `hotfix`: `NO_GO` quando `coverage < 65`, `REVIEW` quando `coverage >= 65 && coverage < 80`, `GO` quando `coverage >= 80`.
- Preservar regras já existentes para sinais bloqueantes e de revisão (`critical`, testes mandatórios falhados, `high` em limiar de revisão, lint errors) com precedência `NO_GO > REVIEW > GO`.
- Atualizar testes, documentação e cenários de simulação para refletir o comportamento novo sem alterar contrato público.
- Declarar impacto esperado na seed reavaliada e nas contagens agregadas expostas pela API.

## Capabilities

### New Capabilities
- `release-policy/hotfix`: Definir decisão de release para hotfix com limiares de cobertura específicos por tipo de release e precedência de decisão preservada.

### Modified Capabilities
- Nenhuma (não há capability existente em `openspec/specs/` para policy de hotfix).

## Impact

- **Contrato congelado (`POST /api/v1/evaluations`)**: não muda request, response, nem valores de `Decision`.
- **Código afetado**: `apps/api/src/services/releaseService.ts`, `apps/api/src/constants.ts`, `apps/api/src/routes/index.ts`, `apps/api/src/repository/evaluationRepository.ts`, `apps/api/src/seeds/seedData.ts`, `apps/api/test/policy.test.ts`, `apps/api/test/api.test.ts`, `docs/release-policy.md`, `scripts/validate.mjs`, `scripts/simulate-pipeline.cjs`.
- **Divergências baseline potencialmente tratadas**: D-04/D-07 (motor passa a emitir `REVIEW` também em hotfix), D-01/D-02 (se limiares forem centralizados e reutilizados no snapshot da policy).
- **Divergências baseline fora de escopo**: D-03, D-08, D-09, D-10, D-11, D-13, D-14.

## Non-Objectives

- Não alterar schemas, tipos ou reason codes em `packages/contracts/src/index.ts`.
- Não criar novos endpoints, persistência externa, base de dados, Docker ou dependências.
- Não resolver defeitos não relacionados ao CR-01 (ex.: bug de `?limit=` ou limpeza de código morto).
