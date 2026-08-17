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
| `REVIEW` | Release exige gate manual antes de deployment |
| `NO_GO` | Release bloqueada |

## Regras em vigor

### Bloqueios duros (precedência máxima)

Se qualquer condição abaixo for verdadeira, a decisão final é `NO_GO`:

- `tests.failed > 0` -> `MANDATORY_TEST_FAILURE`
- `security.critical > 0` -> `CRITICAL_SECURITY_VULNERABILITY`
- `security.high > 0` -> `HIGH_SECURITY_RISK`
- `lintErrors > 0` -> `LINT_ERRORS`

### Cobertura (apenas sem bloqueios duros)

Thresholds por tipo de release:

- `standard`
  - `coverage >= 75` -> `GO`
  - `70 <= coverage < 75` -> `REVIEW`
  - `coverage < 70` -> `NO_GO`
- `hotfix`
  - `coverage >= 80` -> `GO`
  - `75 <= coverage < 80` -> `REVIEW`
  - `coverage < 75` -> `NO_GO`

Em decisões `REVIEW`, o único reason code é `COVERAGE_BELOW_MINIMUM`.
Em `NO_GO` por cobertura (sem bloqueios duros), mantém-se `COVERAGE_BELOW_MINIMUM`.

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Vulnerabilidade **high** bloqueia a release (`HIGH_SECURITY_RISK`).

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

A policy diferencia releases `standard` e `hotfix` na avaliação de cobertura,
mantendo `hotfix` mais rigoroso.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
