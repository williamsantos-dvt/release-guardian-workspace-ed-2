# Design – Introdução do veredito REVIEW

## Overview

A especificação mapeia diretamente para o código atual do Release Guardian. O design descreve quais ficheiros são alterados, o fluxo de dados e a interação com os consumidores.

## Componentes impactados

### API e policy engine (`apps/api/src/services/releaseService.ts` + `constants.ts`)
- `DecisionResult` passa a aceitar `decision: 'GO' | 'REVIEW' | 'NO_GO'`.
- `evaluateRelease` recolhe razões adicionais (`HIGH_SECURITY_RISK`, `COVERAGE_NEEDS_REVIEW`) e decide o veredito:
  1. Existência de razões bloqueantes (`COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `LINT_ERRORS`) → `NO_GO`.
  2. Razões de revisão (`HIGH_SECURITY_RISK`, `COVERAGE_NEEDS_REVIEW`) → `REVIEW`.
  3. Caso contrário → `GO`.
- `MINIMUM_COVERAGE` fica como o valor técnico (70) e um novo `TARGET_COVERAGE` (85) explica a zona de revisão.

### Contratos (`packages/contracts`)
- Tipos (`ReleaseEvidence`, `ReleaseEvaluation`, `DecisionResult`) e JSON Schemas devem aceitar `decision: 'REVIEW'`.
- Os testes de contratos validam payloads com `decision: "REVIEW"` e garantem compatibilidade com a resposta real da API.

### Rotas e estatísticas (`apps/api/src/routes/index.ts`)
- `GET /api/v1/policy` expõe `supportedDecisions` e os limiares atualizados (`minimumCoverage`, `targetCoverage`).
- `GET /api/v1/statistics` inclui a comunidade `REVIEW` em `byDecision` e mantém `topBlockingReasons` com as novas razões.

### Simulador e exemplos (`scripts/simulate-pipeline.cjs`, `examples/*.json`)
- Novos cenários `examples/review-coverage.json` e `examples/review-security.json` que disparam `REVIEW`.
- O simulador imprime mensagens específicas para `REVIEW` (“requer aprovação manual”).

### Dashboard
- Consome a API; se `byDecision.REVIEW` aparecer, os contadores e o histórico refletem automaticamente a nova decisão sem alterar o contrato.

## Fluxo de dados

1. Pipeline (ou simulador) envia `ReleaseEvidence`.
2. `evaluateRelease` calcula `reasons` e decide `GO/REVIEW/NO_GO`.
3. `EvaluationRepository` persiste a avaliação (em memória) e inclui `decision`. O histórico seed é reavaliado com a nova policy a cada start.
4. Rotas `/api/v1/evaluations` e `/api/v1/statistics` devolvem o veredito junto com razões apropriadas.
5. Dashboard lê esses endpoints; o simulador usa `examples/*.json` para validar cenários `REVIEW`.

## Testabilidade

- Para cada requisito do spec há pelo menos um teste no `apps/api` ou `packages/contracts`.
- O smoke test do `scripts/validate.mjs` continua a subir a API com `npm exec`/`npx` e garante que `/health`, `/api/v1/evaluations` e `/api/v1/statistics` cumprem as expectativas.
- Cobertura aparece no relatório de coverage e deve manter-se próxima de 100% statements/lines e >90% branches.
