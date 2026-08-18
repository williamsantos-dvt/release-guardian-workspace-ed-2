## 1. Motor de policy

- [ ] 1.1 Introduzir avaliacao de coverage por `releaseType` em `apps/api/src/services/releaseService.ts` com bandas:
  - `standard`: `<70 NO_GO`, `70..79.99 REVIEW`, `>=80 sem razao`
  - `hotfix`: `<65 NO_GO`, `65..79.99 REVIEW`, `>=80 sem razao`
- [ ] 1.2 Refatorar regras para retornarem `reason + severity` e derivar decisao pela severidade maxima (`NO_GO > REVIEW > GO`).
- [ ] 1.3 Atualizar thresholds: `security.high >= 3` para `HIGH_SECURITY_RISK` (REVIEW).
- [ ] 1.4 Atualizar semantica de lint: `lintErrors > 0` gera `LINT_ERRORS` com severidade `REVIEW`.
- [ ] 1.5 Garantir ordem canonica inalterada das razoes e retorno de todas as razoes aplicaveis.

## 2. Constantes de policy

- [ ] 2.1 Substituir `MINIMUM_COVERAGE` unico por constantes por tipo de release em `apps/api/src/constants.ts`.
- [ ] 2.2 Atualizar consumo dessas constantes no motor, removendo literals numericos de policy no codigo de decisao.
- [ ] 2.3 Preservar contrato do endpoint `/api/v1/policy` sem alterar shape.

## 3. Testes de fronteira e regressao

- [ ] 3.1 Atualizar/estender `apps/api/test/policy.test.ts` para fronteiras `standard` e `hotfix` exatamente como no CR.
- [ ] 3.2 Cobrir `high=2` (sem razao) e `high=3` (`REVIEW` com `HIGH_SECURITY_RISK`).
- [ ] 3.3 Cobrir `lintErrors=1` com cobertura `>=80` resultando em `REVIEW`.
- [ ] 3.4 Cobrir `critical=1` com cobertura `85` resultando em `NO_GO`.
- [ ] 3.5 Cobrir cenario canon: `hotfix` cobertura `67` com restantes sinais saudaveis resultando em `REVIEW`.

## 4. Validacao de seeds e API

- [ ] 4.1 Validar decisao por `releaseId` dos 18 seeds e confirmar total `byDecision = { GO: 10, REVIEW: 4, NO_GO: 4 }`.
- [ ] 4.2 Atualizar expectativas de `apps/api/test/api.test.ts` para refletir o novo `byDecision` e razoes agregadas.

## 5. Testes existentes que devem falhar com a nova policy (antes de atualizar)

- [ ] 5.1 Registar `apps/api/test/policy.test.ts:30` (`high=1 => REVIEW`) como **codifica comportamento antigo**.
- [ ] 5.2 Registar `apps/api/test/policy.test.ts:64` (`high=2 => HIGH_SECURITY_RISK`) como **codifica comportamento antigo**.
- [ ] 5.3 Registar `apps/api/test/policy.test.ts:70` (exclusao de `HIGH_SECURITY_RISK` quando `critical>0`) como **codifica comportamento antigo**.
- [ ] 5.4 Registar `apps/api/test/policy.test.ts:89` (`lintErrors>0 => NO_GO`) como **codifica comportamento antigo**.
- [ ] 5.5 Registar `apps/api/test/api.test.ts:103` (`byDecision` atual) como **codifica comportamento antigo**.
- [ ] 5.6 Registar `apps/api/test/api.test.ts:104` (`topBlockingReasons` atual) como **codifica comportamento antigo**.

## 6. Validacao final

- [ ] 6.1 Executar `npm test`.
- [ ] 6.2 Executar `npm run validate`.
- [ ] 6.3 Confirmar que nao houve alteracoes em `apps/dashboard/`, `scripts/` ou `examples/`.
