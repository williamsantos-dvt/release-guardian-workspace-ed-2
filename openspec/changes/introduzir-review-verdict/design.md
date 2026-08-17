## Contexto tecnico

O motor de policy atual avalia evidencias e emite apenas `GO` ou `NO_GO`.
O contrato compartilhado (`packages/contracts`) ja permite `GO | REVIEW | NO_GO`.
Assim, a mudanca e comportamental, nao estrutural no contrato HTTP.

## Decisoes de design

1. Manter `MINIMUM_COVERAGE = 70` como limiar oficial da mudanca.
2. Preservar todos os blockers existentes como `NO_GO`.
3. Introduzir `REVIEW` apenas para `security.high > 0`, sem blockers.
4. Manter ordem canonica de `reasons` para blockers.
5. Nao introduzir novos campos de request/response.

## Plano de alteracao tecnica

### 1) Motor de decisao

- Arquivo: `apps/api/src/services/releaseService.ts`
- Ajustar `DecisionResult` para suportar `GO | REVIEW | NO_GO`.
- Fluxo de decisao:
  - calcular reasons de bloqueio atuais;
  - se existir qualquer blocker -> `NO_GO`;
  - senao, se `security.high > 0` -> `REVIEW`;
  - senao -> `GO`.

### 2) Testes de policy

- Arquivo: `apps/api/test/policy.test.ts`
- Adicionar cenarios para `REVIEW` e para prioridade de `NO_GO` sobre `REVIEW`.
- Garantir que a ordem de reasons permanece estavel.

### 3) Testes de API e estatisticas

- Arquivo: `apps/api/test/api.test.ts`
- Atualizar expectativa de `byDecision` em `/api/v1/statistics` para refletir
  a nova distribuicao apos reavaliacao dos seeds.
- Cobrir ao menos um caso de `POST /api/v1/evaluations` com `REVIEW`.

### 4) Documentacao

- Arquivo: `docs/release-policy.md`
- Alinhar com a policy implementada:
  - incluir `REVIEW` em decisoes possiveis;
  - cobertura minima 70;
  - regra de `high` sem blockers -> `REVIEW`.

## Validacao

1. `npm test`
2. `npm run validate`
3. Simulador:
   - `healthy-release` -> `GO`
   - cenario com `high` sem blockers -> `REVIEW`
   - `critical-security` -> `NO_GO`

## Riscos e mitigacao

- Risco: mudanca inesperada em contadores do dashboard.
  - Mitigacao: atualizar testes de API e validar `/api/v1/statistics`.

- Risco: divergencia entre docs e codigo apos implementacao.
  - Mitigacao: tratar `docs/release-policy.md` como parte obrigatoria da change.

- Risco: regressao no contrato da API.
  - Mitigacao: manter shape de `EvaluateResponse` e validar com testes de API.
