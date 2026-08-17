## 1. Parametrizar limiares por tipo de release

- [x] 1.1 Atualizar `apps/api/src/constants.ts` para representar limiares de coverage por `releaseType` (`standard` e `hotfix`) e ajustar `POLICY_VERSION` para a mudança de comportamento.
- [x] 1.2 Atualizar `apps/api/src/services/releaseService.ts` para selecionar limiares por `releaseType`, manter precedência `NO_GO > REVIEW > GO` e preservar ordem canónica de reasons.
- [x] 1.3 Atualizar `apps/api/src/routes/index.ts` (`GET /api/v1/policy`) para expor snapshot coerente com os limiares efetivos aplicados pelo motor.

## 2. Alinhar histórico e documentação

- [x] 2.1 Verificar impacto da reavaliação da seed em `apps/api/src/repository/evaluationRepository.ts` e `apps/api/src/seeds/seedData.ts`, com foco em `EV-0018` (`hotfix`, coverage 67) migrando para `REVIEW`.
- [x] 2.2 Atualizar `docs/release-policy.md` para refletir os limiares por tipo de release e o cenário canónico `hotfix-release`.

## 3. Atualizar testes e scripts com justificação

- [x] 3.1 Alterar `apps/api/test/policy.test.ts` para cobrir fronteiras de hotfix (`64.9`, `65`, `79.99`, `80`) e cenários de precedência; **justificação:** a policy passa a depender de `releaseType` e os testes atuais não validam este eixo.
- [x] 3.2 Alterar `apps/api/test/api.test.ts` para atualizar expectativas de `byDecision` e cenários HTTP relacionados a hotfix; **justificação:** a seed é reavaliada no arranque e o resultado agregado muda com o novo limiar de hotfix.
- [x] 3.3 Ajustar `scripts/validate.mjs` e/ou `scripts/simulate-pipeline.cjs` quando houver asserts acoplados às contagens antigas; **justificação:** evitar falso negativo de validação por expectativas pré-CR-01.

## 4. Validação independente final

- [x] 4.1 Executar `npm run validate` e colar output real completo das 5 camadas no registo da mudança.
- [x] 4.2 Executar `npm run simulate:pipeline -- hotfix-release` e um cenário `standard` comparável, confirmando `hotfix` com 67 em `REVIEW` e `standard` com 67 em `NO_GO`, com outputs reais colados.
