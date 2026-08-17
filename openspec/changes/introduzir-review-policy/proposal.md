## Why

Hoje a engine de policy emite apenas `GO` e `NO_GO`, embora o contrato publico ja suporte `REVIEW`.
Isso impede representar o caso operacional de "seguir com gate manual" para cobertura moderadamente baixa e deixa `security.high` sem bloqueio explicito na decisao.

## What Changes

- Evoluir a policy para emitir `GO | REVIEW | NO_GO` sem mudar shape HTTP.
- Introduzir bloqueio duro para `security.high > 0` com reason code `HIGH_SECURITY_RISK`.
- Aplicar thresholds de cobertura por `releaseType` (`standard` e `hotfix`), com `hotfix` mais rigoroso.
- Manter ordem canonica e estavel de `reasons`.
- Atualizar testes unitarios/API e documentacao para refletir o novo comportamento.

## Capabilities

### New Capabilities
- `release-policy`: Define decisao tripla (`GO/REVIEW/NO_GO`), precedencia de bloqueios duros e regras de cobertura por tipo de release.

### Modified Capabilities
- None.

## Impact

- Codigo afetado: `apps/api/src/services/releaseService.ts`, `apps/api/src/constants.ts`, `apps/api/src/routes/index.ts`, `apps/api/src/repository/evaluationRepository.ts`.
- Contratos: `packages/contracts/src/index.ts` (reason codes).
- Testes: `apps/api/test/policy.test.ts`, `apps/api/test/api.test.ts`, validacao integrada (`npm run validate`).
- API/compatibilidade: sem mudanca de endpoints, status codes, ou shape de request/response.
