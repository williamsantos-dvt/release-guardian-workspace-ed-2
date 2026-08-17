## 1. Policy engine

- [x] 1.1 Atualizar `DecisionResult` em `apps/api/src/services/releaseService.ts` para suportar `GO | REVIEW | NO_GO`
- [x] 1.2 Implementar regra de decisao: blockers -> `NO_GO`, sem blockers + `high` -> `REVIEW`, senao `GO`
- [x] 1.3 Preservar ordem canonica de `reasons` para blockers

## 2. Testes

- [x] 2.1 Atualizar `apps/api/test/policy.test.ts` com cenarios de `REVIEW`
- [x] 2.2 Adicionar teste de prioridade: `NO_GO` prevalece sobre `REVIEW`
- [x] 2.3 Garantir cobertura de ordem de reasons com multiplos blockers
- [x] 2.4 Atualizar `apps/api/test/api.test.ts` para nova distribuicao `byDecision`
- [x] 2.5 Cobrir via API um caso que resulte em `REVIEW`

## 3. Documentacao

- [x] 3.1 Atualizar `docs/release-policy.md` para policy com `REVIEW`
- [x] 3.2 Manter alinhamento com `docs/release-policy-review.md`

## 4. Validacao

- [x] 4.1 Executar `npm test`
- [x] 4.2 Executar `npm run validate`
- [x] 4.3 Validar simulador: `healthy-release` (GO), caso high sem blockers (REVIEW), `critical-security` (NO_GO)
