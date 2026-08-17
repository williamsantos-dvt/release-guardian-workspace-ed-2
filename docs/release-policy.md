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

- **STANDARD**
  - `coverage < 70` -> `NO_GO` com `COVERAGE_BELOW_MINIMUM`
  - `70 <= coverage < 80` -> `REVIEW` com `COVERAGE_NEEDS_REVIEW`
  - `coverage >= 80` -> sem restrição de cobertura

- **HOTFIX**
  - `coverage < 65` -> `NO_GO` com `COVERAGE_BELOW_MINIMUM`
  - `65 <= coverage < 80` -> `REVIEW` com `COVERAGE_NEEDS_REVIEW`
  - `coverage >= 80` -> sem restrição de cobertura

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Vulnerabilidades **high >= 3** exigem revisão manual (`HIGH_SECURITY_RISK`).

### Lint

- Erros de lint exigem revisão manual (`LINT_ERRORS`).

### Precedência de decisão

Quando coexistem sinais bloqueantes e sinais de revisão:

`NO_GO > REVIEW > GO`

## Ordem das razões

Quando várias regras se aplicam, todas as razões são devolvidas pela seguinte
ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `HIGH_SECURITY_RISK`
5. `COVERAGE_NEEDS_REVIEW`
6. `LINT_ERRORS`

## Tipos de release

A policy aplica-se de forma idêntica a releases `standard` e `hotfix`.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
