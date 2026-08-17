## Contexto tecnico

O motor atual ja diferencia `NO_GO`, `REVIEW` e `GO`, mas ainda nao aplica a
matriz de cobertura por tipo de release exigida no CR-01.

## Decisoes de design

1. Coverage passa a depender de `releaseType`.
2. Regras de bloqueio e review sao avaliadas separadamente.
3. `LINT_ERRORS` deixa de ser blocker; vira sinal de review quando sem blockers.
4. `security.high` passa a sinalizar review apenas com limiar `>= 3`.
5. Contrato HTTP e schemas continuam inalterados.

## Plano de implementacao

### 1) Policy engine

- Arquivo: `apps/api/src/services/releaseService.ts`
- Adicionar thresholds:
  - standard minimo 70
  - hotfix minimo 65
  - faixa de review ate 79.99 para ambos
- Determinar blockers:
  - coverage abaixo do minimo por tipo
  - testes falhados
  - critical > 0
- Determinar review signals:
  - coverage em faixa de review por tipo
  - high >= 3
  - lintErrors > 0
- Decisao final por precedencia: NO_GO > REVIEW > GO.

### 2) Testes

- `apps/api/test/policy.test.ts`
  - Cobrir standard/hotfix em limites de coverage
  - Cobrir high >= 3 e lint como review
  - Cobrir precedencia de NO_GO
- `apps/api/test/api.test.ts`
  - Cobrir endpoint com hotfix 67 -> REVIEW
  - Cobrir standard 67 -> NO_GO
  - Atualizar `byDecision` dos seeds

### 3) Documentacao e exemplos

- Atualizar `docs/release-policy.md` e `docs/release-policy-review.md`.
- Ajustar exemplo `examples/high-security-review.json` para o limiar `high >= 3`.

## Validacao

1. `npm test`
2. `npm run validate`
3. `npm run simulate:pipeline -- hotfix-release`
4. `npm run simulate:pipeline -- high-security-review`
5. `npm run simulate:pipeline -- critical-security`
