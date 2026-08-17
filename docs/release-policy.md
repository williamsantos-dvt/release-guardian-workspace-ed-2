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

- **STANDARD**:

  | Cobertura | Decisão |
  |---|---|
  | `< 70` | `NO_GO` (`COVERAGE_BELOW_MINIMUM`) |
  | `70 – 79.99` | `REVIEW` (`COVERAGE_BELOW_TARGET`) |
  | `>= 80` | sem restrição |

- **HOTFIX**:

  | Cobertura | Decisão |
  |---|---|
  | `< 65` | `NO_GO` (`COVERAGE_BELOW_MINIMUM`) |
  | `65 – 79.99` | `REVIEW` (`COVERAGE_BELOW_TARGET`) |
  | `>= 80` | sem restrição |

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`, `NO_GO`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`, `NO_GO`).
- **Qualquer vulnerabilidade high** exige revisão pela equipa de segurança antes
  do deployment (`HIGH_SECURITY_RISK`, para `high >= 3`, decisão `REVIEW`).

### Lint

- Erros de lint exigem revisão manual (`LINT_ERRORS`, decisão `REVIEW`).

## Precedência de decisões

Quando múltiplas regras se aplicam, a decisão final segue:

1. `NO_GO`
2. `REVIEW`
3. `GO`

Isto garante que regras bloqueantes (cobertura abaixo do mínimo, falhas de testes,
vulnerabilidades críticas) nunca são sobrepostas por regras de revisão.

## Ordem das razões

Quando várias regras se aplicam, todas as razões são devolvidas pela seguinte
ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `COVERAGE_BELOW_TARGET`
3. `MANDATORY_TEST_FAILURE`
4. `CRITICAL_SECURITY_VULNERABILITY`
5. `HIGH_SECURITY_RISK`
6. `LINT_ERRORS`

## Tipos de release

A policy distingue releases `standard` e `hotfix` apenas nas bandas de cobertura.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
