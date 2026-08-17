## Why

A policy atual só produz `GO` ou `NO_GO` no motor, apesar de `REVIEW` já existir no contrato e nos consumidores. Isso impede o fluxo de aprovação manual para releases com qualidade intermédia e mantém uma divergência conhecida entre documentação, contrato e implementação.

## What Changes

- Introduzir derivação explícita de decisão por faixa de cobertura: `NO_GO` quando `coverage < 70`, `REVIEW` quando `coverage >= 70 && coverage < 80`, `GO` quando `coverage >= 80`.
- Alinhar o motor com a fonte de verdade dos limiares em `apps/api/src/constants.ts`, removendo dependência de literal hard-coded no serviço.
- Atualizar os cenários de teste e a observabilidade da policy para refletir o novo veredito intermédio sem alterar o contrato público.
- Declarar e documentar o impacto da reavaliação da seed histórica nas contagens agregadas (`byDecision`) e nos testes dependentes.
- Atualizar documentação da policy para remover discrepâncias com o runtime atual.

## Capabilities

### New Capabilities
- `release-policy`: Evoluir a policy de decisão de release para suportar faixa intermédia `REVIEW` baseada em cobertura, mantendo contrato e ordem canónica de razões.

### Modified Capabilities
- Nenhuma (não existem capabilities previamente publicadas em `openspec/specs/` neste repositório).

## Impact

- **Contrato congelado (`POST /api/v1/evaluations`)**: não muda request nem shape da resposta; `Decision` permanece `GO | REVIEW | NO_GO`.
- **Código afetado**: `apps/api/src/services/releaseService.ts`, `apps/api/src/constants.ts`, `apps/api/src/routes/index.ts`, `apps/api/src/repository/evaluationRepository.ts`, `apps/api/src/seeds/seedData.ts`, `apps/api/test/policy.test.ts`, `apps/api/test/api.test.ts`, `docs/release-policy.md`, `scripts/validate.mjs`, `scripts/simulate-pipeline.cjs`.
- **Divergências baseline tratadas**: D-01 (limiar disperso e literal), D-02 (policy endpoint potencialmente divergente do motor), D-04/D-07 (REVIEW no contrato sem emissão no motor).
- **Divergências baseline mantidas**: D-03 (HIGH_SECURITY_RISK inexistente), D-08 (tipagem do motor), D-09 (dupla avaliação), D-10 (bug de `?limit=`), D-11, D-13, D-14.

## Non-Objectives

- Não alterar `ReleaseEvidence`, `EvaluateResponse`, `Decision` ou qualquer schema em `packages/contracts`.
- Não introduzir persistência externa, base de dados, Docker ou novas dependências.
- Não resolver divergências fora do escopo desta mudança (ex.: `HIGH_SECURITY_RISK`, bug de paginação por `limit`, refactors estruturais).
