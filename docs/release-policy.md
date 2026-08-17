# Release Policy — Referência Funcional

> Documentação de referência da release policy do Release Guardian.
> Última revisão conhecida: atualização maior da policy (ver changelog interno).

## Visão geral

O Guardian avalia cada submissão de evidência contra a policy em vigor e devolve
uma decisão com as razões aplicáveis.

## Decisões possíveis

| Decisão | Significado |
|---|---|
| `GO` | Release aprovada para deployment |
| `REVIEW` | Release exige aprovação manual antes do deployment |
| `NO_GO` | Release bloqueada |

## Regras em vigor

### Cobertura

- **Cobertura mínima: 70%.** Cobertura inferior a 70% bloqueia a release
  (`COVERAGE_BELOW_MINIMUM`).

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Qualquer vulnerabilidade **high** exige revisão pela equipa de segurança antes
  do deployment (`HIGH_SECURITY_RISK`).

## Precedência da decisão

- Se existir pelo menos uma razão bloqueante, a decisão final é `NO_GO`.
- Caso não exista razão bloqueante, mas exista pelo menos uma razão de revisão,
  a decisão final é `REVIEW`.
- Sem razões aplicáveis, a decisão final é `GO`.

Razões bloqueantes:

- `COVERAGE_BELOW_MINIMUM`
- `MANDATORY_TEST_FAILURE`
- `CRITICAL_SECURITY_VULNERABILITY`
- `LINT_ERRORS`

Razões de revisão:

- `HIGH_SECURITY_RISK`

### Lint

- Erros de lint bloqueiam a release (`LINT_ERRORS`).

## Ordem das razões

Quando várias regras se aplicam, todas as razões são devolvidas pela seguinte
ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `HIGH_SECURITY_RISK`
5. `LINT_ERRORS`

## Tipos de release

A policy aplica-se de forma idêntica a releases `standard` e `hotfix`.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
