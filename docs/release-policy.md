# Release Policy — Referência Funcional

> Documentação de referência da release policy do Release Guardian.
> Última revisão: CR-01 (Emergency Hotfix Policy) — thresholds de cobertura por
> tipo de release. Ver `docs/change-requests/cr-01-hotfix-policy.md`.

## Visão geral

O Guardian avalia cada submissão de evidência contra a policy em vigor e devolve
uma decisão com as razões aplicáveis.

## Decisões possíveis

| Decisão | Significado |
|---|---|
| `GO` | Release aprovada para deployment |
| `REVIEW` | Release não bloqueada, mas exige aprovação manual antes do deployment |
| `NO_GO` | Release bloqueada |

## Regras em vigor

### Cobertura

Os thresholds dependem do tipo de release. A razão emitida é sempre
`COVERAGE_BELOW_MINIMUM`; o que varia é a severidade.

**`standard`**

| Cobertura | Decisão |
|---|---|
| `< 70` | `NO_GO` |
| `70 – 79.99` | `REVIEW` |
| `>= 80` | sem razão |

**`hotfix`**

| Cobertura | Decisão |
|---|---|
| `< 65` | `NO_GO` |
| `65 – 79.99` | `REVIEW` |
| `>= 80` | sem razão |

O piso mais baixo para hotfixes existe para não atrasar a mitigação de
incidentes com bloqueios de cobertura, mantendo ainda assim a exigência de
aprovação manual.

Os valores vivem em `COVERAGE_THRESHOLDS` (`apps/api/src/constants.ts`) e são a
única fonte de verdade. Não há literais numéricos de policy no motor.

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release
  (`CRITICAL_SECURITY_VULNERABILITY`).
- **Três ou mais** vulnerabilidades **high** exigem revisão manual antes do
  deployment (`HIGH_SECURITY_RISK`). Uma ou duas não produzem razão.

### Lint

- Erros de lint exigem revisão manual (`LINT_ERRORS`). Não bloqueiam.

## Precedência das decisões

Cada regra devolve, quando aplicável, uma razão e uma severidade. A decisão final
é a severidade máxima observada:

```text
NO_GO  >  REVIEW  >  GO
```

1. Se alguma regra devolveu severidade `NO_GO`, a decisão é `NO_GO`.
2. Caso contrário, se alguma devolveu `REVIEW`, a decisão é `REVIEW`.
3. Caso contrário, a decisão é `GO` e `reasons` vem vazio.

Uma razão de revisão nunca reduz a severidade de um bloqueio. Todas as razões
aplicáveis continuam a ser devolvidas, mesmo as de revisão numa release
bloqueada.

Note-se que `COVERAGE_BELOW_MINIMUM` não tem severidade fixa: 67% num `hotfix`
produz `REVIEW`, o mesmo valor num `standard` produz `NO_GO`.

## Ordem das razões

Quando várias regras se aplicam, todas as razões são devolvidas pela seguinte
ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `HIGH_SECURITY_RISK`
5. `LINT_ERRORS`

A ordem canónica é definida por `REASON_CODES` em `packages/contracts` e é a
mesma pela qual o motor avalia as regras.

## Tipos de release

`standard` e `hotfix` partilham todas as regras excepto o piso de cobertura
(70 vs 65). O tecto de revisão é 80 em ambos.

## Estatísticas

`GET /api/v1/statistics` distingue as duas naturezas de razão:

- `byDecision` conta todas as avaliações por decisão, incluindo `REVIEW`.
- `topBlockingReasons` é construído apenas a partir de avaliações `NO_GO`.
  Avaliações `REVIEW` não contribuem.

Uma avaliação `NO_GO` contribui com todas as razões que acumulou, incluindo as
de severidade de revisão. Uma release bloqueada por `critical` que também tenha
erros de lint conta para ambas as razões.

O histórico é reavaliado contra a policy em vigor em cada arranque do serviço,
pelo que uma evolução da policy se reflete retroativamente nas estatísticas.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.

`REVIEW` e `HIGH_SECURITY_RISK` são valores dentro do contrato existente —
`decision` já admitia `REVIEW` no schema de resposta e `reasons` é `string[]` sem
enumeração restritiva. A sua introdução não constituiu alteração de contrato.
