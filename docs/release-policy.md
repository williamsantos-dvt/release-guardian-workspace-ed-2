# Release Policy — Referência Funcional

> Documentação de referência da release policy do Release Guardian.
> Última revisão conhecida: policy `1.4.0`.

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

- **STANDARD**:

| Cobertura | Decisão |
|---|---|
| `< 70` | `NO_GO` (`COVERAGE_BELOW_MINIMUM`) |
| `70 <= coverage < 80` | `REVIEW` (`COVERAGE_REQUIRES_REVIEW`) |
| `>= 80` | sem razão de cobertura |

- **HOTFIX**:

| Cobertura | Decisão |
|---|---|
| `< 65` | `NO_GO` (`COVERAGE_BELOW_MINIMUM`) |
| `65 <= coverage < 80` | `REVIEW` (`COVERAGE_REQUIRES_REVIEW`) |
| `>= 80` | sem razão de cobertura |

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Vulnerabilidades **high >= 3** exigem revisão manual (`HIGH_SECURITY_RISK`).

### Lint

- Erros de lint exigem revisão manual (`LINT_ERRORS`).

## Ordem das razões

Quando várias regras se aplicam, todas as razões são devolvidas pela seguinte
ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `HIGH_SECURITY_RISK`
5. `COVERAGE_REQUIRES_REVIEW`
6. `LINT_ERRORS`

## Tipos de release

A policy aplica limiares de cobertura distintos para releases `standard` e `hotfix`.

No endpoint `GET /api/v1/policy`, o campo `minimumCoverage` representa o limiar
mínimo para `hotfix` (65).

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
