## Context

O CR-01 introduz cobertura por tipo de release e altera severidade de regras existentes (`high` e `lint`). Com isso, a estrategia atual de classificar razoes de forma estatica em "bloqueantes" vs "revisao" deixa de ser suficiente, porque `COVERAGE_BELOW_MINIMUM` passa a poder significar `NO_GO` ou `REVIEW` conforme tipo de release e valor de cobertura.

Restricoes que permanecem:

- Contrato HTTP de `POST /api/v1/evaluations` congelado.
- `packages/contracts` continua fonte de verdade para tipos/enums/schemas.
- Motor de decisao permanece centralizado em `apps/api/src/services/releaseService.ts`.
- Fora de ambito: `apps/dashboard/`, `scripts/`, `examples/`, novas dependencias.

## Goals / Non-goals

**Goals:**

- Modelar regras como avaliadores que devolvem `reason + severity` (em vez de razao com severidade fixa externa).
- Calcular decisao final pela severidade maxima observada (`NO_GO > REVIEW > GO`).
- Introduzir constantes de cobertura por tipo de release, sem literals numericos no motor.
- Manter ordem canonica de razoes e devolver todas as razoes aplicaveis.

**Non-goals:**

- Alterar shape de API ou JSON Schemas.
- Alterar dashboard/simulador/scripts/examples.
- Introduzir persistencia nova ou alteracoes de infraestrutura.

## Proposed Structure

### 1) Resultado de regra com severidade explicita

Definir um modelo interno no motor:

```ts
type RuleSeverity = 'GO' | 'REVIEW' | 'NO_GO';

interface RuleHit {
  reason: string;
  severity: Exclude<RuleSeverity, 'GO'>;
}
```

Cada regra recebe `ReleaseEvidence` e retorna `RuleHit | null`.

Exemplos:

- `coverageRule(evidence)` retorna `COVERAGE_BELOW_MINIMUM` com `NO_GO` ou `REVIEW` conforme banda.
- `testsRule` retorna `MANDATORY_TEST_FAILURE` com `NO_GO`.
- `criticalRule` retorna `CRITICAL_SECURITY_VULNERABILITY` com `NO_GO`.
- `highRule` retorna `HIGH_SECURITY_RISK` com `REVIEW` apenas para `high >= 3`.
- `lintRule` retorna `LINT_ERRORS` com `REVIEW` para `lintErrors > 0`.

### 2) Decisao pela severidade maxima

Pipeline no motor:

1. Avaliar todas as regras numa ordem fixa igual a ordem canonica de razoes.
2. Coletar `RuleHit[]` sem short-circuit.
3. Derivar `decision` pela maior severidade presente:
   - existe `NO_GO` -> `NO_GO`
   - senao existe `REVIEW` -> `REVIEW`
   - senao -> `GO`
4. Construir `reasons` como `hits.map((h) => h.reason)`.

Esta estrutura substitui a classificacao estatica de razoes em arrays "blocking"/"review", que deixa de ser correta para cobertura.

### 3) Constantes de coverage por release type

`MINIMUM_COVERAGE` unico deixa de representar a policy completa. Proposta em `apps/api/src/constants.ts`:

```ts
export const COVERAGE_THRESHOLDS = {
  standard: { noGoBelow: 70, reviewBelow: 80 },
  hotfix: { noGoBelow: 65, reviewBelow: 80 },
} as const;
```

Notas:

- O endpoint `/api/v1/policy` permanece com o campo `minimumCoverage` (contrato congelado). Para compatibilidade, pode continuar a expor o valor `standard.noGoBelow`.
- O motor deixa de depender de `MINIMUM_COVERAGE` unico para decidir coverage.

### 4) Ordem canonica inalterada

A ordem de regras deve permanecer:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `HIGH_SECURITY_RISK`
5. `LINT_ERRORS`

Como a ordem de avaliacao e fixa, nao e necessario sort adicional das razoes.

## Risks / Trade-offs

- `minimumCoverage` em `/api/v1/policy` deixa de descrever toda a policy de coverage (apenas parte standard).
  - Mitigacao: explicitar no codigo/testes e em documentacao interna da change.
- Mudanca de semantica de `lint` (de bloqueante para revisao) altera estatisticas e expectativas de testes existentes.
  - Mitigacao: listar testes afetados e classificar como comportamento antigo codificado.
- Possivel ambiguidade sobre combinacoes `critical + high >= 3`.
  - Mitigacao: especificar que todas as razoes aplicaveis sao devolvidas e que a precedencia decide resultado final.

## Verification Plan

- Cobrir fronteiras pedidas no CR para `standard` e `hotfix`.
- Cobrir limiar `high` (`2` vs `3`) e nova semantica de `lint`.
- Confirmar cenario canone `hotfix 67 => REVIEW`.
- Confirmar impacto dos 18 seeds: `byDecision = { GO: 10, REVIEW: 4, NO_GO: 4 }`.
