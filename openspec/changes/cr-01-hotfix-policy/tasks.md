## 1. Policy engine

- [x] 1.1 Implementar thresholds de cobertura por tipo (`standard` e `hotfix`)
- [x] 1.2 Aplicar precedencia `NO_GO > REVIEW > GO`
- [x] 1.3 Atualizar regras de review para `security.high >= 3`
- [x] 1.4 Tratar `lintErrors > 0` como `REVIEW` sem blockers

## 2. Testes

- [x] 2.1 Atualizar testes unitarios de policy para matriz de coverage por tipo
- [x] 2.2 Cobrir casos de high>=3 e lint como review
- [x] 2.3 Cobrir precedencia com sinais mistos
- [x] 2.4 Atualizar testes de API para cenarios CR-01
- [x] 2.5 Atualizar expectativa de estatisticas dos seeds

## 3. Documentacao e exemplos

- [x] 3.1 Atualizar `docs/release-policy.md` com matriz STANDARD/HOTFIX
- [x] 3.2 Atualizar `docs/release-policy-review.md`
- [x] 3.3 Ajustar exemplo `high-security-review` para `high >= 3`

## 4. Validacao

- [x] 4.1 Executar `npm test`
- [x] 4.2 Executar `npm run validate`
- [x] 4.3 Validar simulador com cenarios principais do CR-01
