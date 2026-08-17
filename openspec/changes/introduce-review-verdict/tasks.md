## 1. Atualizar policy core e pontos de verdade

- [ ] 1.1 Atualizar `apps/api/src/constants.ts` para explicitar as faixas de cobertura aplicadas (`<70`, `>=70 && <80`, `>=80`) e ajustar `POLICY_VERSION` para refletir a mudança de comportamento.
- [ ] 1.2 Refatorar `apps/api/src/services/releaseService.ts` para derivar a decisão base por faixa de coverage e aplicar overrides de bloqueio (`tests.failed`, `security.critical`, `lintErrors`) mantendo ordem canónica de reasons.
- [ ] 1.3 Garantir que `apps/api/src/routes/index.ts` (incluindo `GET /api/v1/policy`) lê os mesmos limiares efetivos do motor, sem drift entre snapshot e runtime.

## 2. Atualizar histórico determinístico e observabilidade

- [ ] 2.1 Revalidar o efeito da nova policy sobre a seed em `apps/api/src/seeds/seedData.ts` + `apps/api/src/repository/evaluationRepository.ts`, documentando os casos movidos para `REVIEW` e preservando formato `EV-\d{4}`.
- [ ] 2.2 Atualizar `docs/release-policy.md` com os novos limiares de decisão e com a emissão real de `REVIEW`, alinhando documentação e comportamento observado.

## 3. Ajustar testes e scripts com justificação explícita

- [ ] 3.1 Alterar `apps/api/test/policy.test.ts` para cobrir fronteiras 70/80 e casos de override para `NO_GO`; **justificação**: a policy mudou e os asserts anteriores fixavam baseline GO/NO_GO sem faixa intermédia.
- [ ] 3.2 Alterar `apps/api/test/api.test.ts` para refletir o novo snapshot de policy e novas contagens agregadas da seed (`byDecision`), incluindo presença de `REVIEW`; **justificação**: a reavaliação da seed muda resultados esperados em runtime.
- [ ] 3.3 Ajustar `scripts/validate.mjs` e/ou verificações de smoke relacionadas quando dependerem de contagens antigas da seed; **justificação**: evitar falso negativo por expectativas acopladas ao baseline anterior.

## 4. Validação independente final

- [ ] 4.1 Executar `npm run validate` (5 camadas) e colar output real no registo da mudança/PR.
- [ ] 4.2 Executar `npm run simulate:pipeline -- low-coverage` e `npm run simulate:pipeline -- healthy-release` (ou cenários equivalentes que evidenciem `NO_GO` e `GO`), incluindo pelo menos um cenário que resulte em `REVIEW`, e colar os outputs reais.
