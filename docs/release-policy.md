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

- **Cobertura < 60%** bloqueia a release (`COVERAGE_BELOW_MINIMUM`).
- **Cobertura de 60% a 79%** exige revisão manual (`COVERAGE_REQUIRES_REVIEW`).
- **Cobertura >= 80%** não gera razão de cobertura.

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Vulnerabilidades **high** com `critical == 0` exigem revisão manual
  (`HIGH_SECURITY_RISK`).

### Lint

- Erros de lint bloqueiam a release (`LINT_ERRORS`).

## Ordem das razões

Quando várias regras se aplicam, todas as razões são devolvidas pela seguinte
ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `COVERAGE_REQUIRES_REVIEW`
3. `MANDATORY_TEST_FAILURE`
4. `CRITICAL_SECURITY_VULNERABILITY`
5. `HIGH_SECURITY_RISK`
6. `LINT_ERRORS`

## Tipos de release

A policy aplica-se de forma idêntica a releases `standard` e `hotfix`.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
