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
| `REVIEW` | Release requer aprovação manual antes do deployment |
| `NO_GO` | Release bloqueada |

## Regras em vigor

### Cobertura

- **Cobertura mínima: 75%.** Cobertura inferior a 75% bloqueia a release
  (`COVERAGE_BELOW_MINIMUM`).

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Vulnerabilidades **high** sem findings critical exigem revisão pela equipa de
  segurança (`HIGH_SECURITY_RISK`).

### Lint

- Erros de lint bloqueiam a release (`LINT_ERRORS`).

## Ordem das razões

Quando várias regras se aplicam, todas as razões são devolvidas pela seguinte
ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `LINT_ERRORS`
5. `HIGH_SECURITY_RISK`

## Composição da decisão

- Se existir pelo menos uma razão bloqueante (`COVERAGE_BELOW_MINIMUM`,
  `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`, `LINT_ERRORS`),
  a decisão final é `NO_GO`.
- Se não existir razão bloqueante, mas existir `HIGH_SECURITY_RISK`, a decisão
  final é `REVIEW`.
- Sem razões, a decisão final é `GO`.

## Tipos de release

A policy aplica-se de forma idêntica a releases `standard` e `hotfix`.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
