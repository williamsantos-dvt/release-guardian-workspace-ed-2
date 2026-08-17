# Release Policy — Referência Funcional

> Documentação de referência da release policy do Release Guardian.
> Última revisão: mudança `evolve-release-policy-review` — introdução do veredito
> `REVIEW` e da razão `HIGH_SECURITY_RISK`.

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

- **Cobertura mínima: 70%.** Cobertura inferior ao mínimo bloqueia a release
  (`COVERAGE_BELOW_MINIMUM`).

> **Questão aberta.** Esta referência documentou durante algum tempo um mínimo de
> **75%**, valor que a implementação nunca aplicou. O limiar efetivamente em vigor
> é **70%**, confirmado por sondas HTTP ao serviço em execução
> (`coverage=74` devolve `GO`). O valor correto é uma decisão de negócio ainda
> pendente e está deliberadamente fora do âmbito da mudança
> `evolve-release-policy-review`. Ver `docs/investigation-baseline.md` §5 e §7.
>
> O limiar tem uma única fonte de verdade: a constante `MINIMUM_COVERAGE` em
> `apps/api/src/constants.ts`. Alterar essa constante altera simultaneamente as
> decisões e o valor devolvido por `GET /api/v1/policy`.

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release
  (`CRITICAL_SECURITY_VULNERABILITY`).
- Qualquer vulnerabilidade **high**, na ausência de vulnerabilidades critical,
  exige revisão manual antes do deployment (`HIGH_SECURITY_RISK`) e produz a
  decisão `REVIEW`.
- As duas razões são **mutuamente exclusivas**: quando existe uma vulnerabilidade
  critical, a release é bloqueada e `HIGH_SECURITY_RISK` não é emitido — o
  bloqueio já é a resposta mais restritiva, e sinalizar revisão seria redundante.

### Lint

- Erros de lint bloqueiam a release (`LINT_ERRORS`).

## Precedência das decisões

Uma avaliação pode acumular várias razões. A decisão final deriva delas por
precedência fixa:

```text
NO_GO  >  REVIEW  >  GO
```

1. Se estiver presente **qualquer** razão bloqueante
   (`COVERAGE_BELOW_MINIMUM`, `MANDATORY_TEST_FAILURE`,
   `CRITICAL_SECURITY_VULNERABILITY`, `LINT_ERRORS`), a decisão é `NO_GO`.
2. Caso contrário, se estiver presente uma razão de revisão
   (`HIGH_SECURITY_RISK`), a decisão é `REVIEW`.
3. Caso contrário, a decisão é `GO` e `reasons` vem vazio.

Uma razão de revisão nunca reduz a severidade de um bloqueio.

## Ordem das razões

Quando várias regras se aplicam, todas as razões são devolvidas pela seguinte
ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `HIGH_SECURITY_RISK`
5. `LINT_ERRORS`

A ordem canónica é definida por `REASON_CODES` em `packages/contracts` e é a
mesma que o motor de decisão respeita.

## Tipos de release

A policy aplica-se de forma idêntica a releases `standard` e `hotfix`.

## Estatísticas

`GET /api/v1/statistics` distingue as duas naturezas de razão:

- `byDecision` conta todas as avaliações por decisão, incluindo `REVIEW`.
- `topBlockingReasons` é construído **apenas** a partir de avaliações `NO_GO`.
  Razões que só exigem revisão não são contabilizadas como bloqueantes.

O histórico é reavaliado contra a policy em vigor em cada arranque do serviço,
pelo que uma evolução da policy se reflete retroativamente nas estatísticas.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.

`REVIEW` e `HIGH_SECURITY_RISK` são **valores** dentro do contrato existente —
`decision` já admitia `REVIEW` no schema de resposta e `reasons` é `string[]` sem
enumeração restritiva. A sua introdução não constituiu alteração de contrato.
