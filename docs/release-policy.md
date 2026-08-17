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

- O Guardian aplica thresholds de cobertura por tipo de release (`COVERAGE_BELOW_MINIMUM`).

**STANDARD**:

| Cobertura | Decisão |
|---|---|
| `< 70` | `NO_GO` |
| `70 – 79.99` | `REVIEW` |
| `>= 80` | sem restrição de cobertura |

**HOTFIX**:

| Cobertura | Decisão |
|---|---|
| `< 65` | `NO_GO` |
| `65 – 79.99` | `REVIEW` |
| `>= 80` | sem restrição de cobertura |

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Vulnerabilidades **high** a partir de 3 (`>= 3`) exigem revisão pela equipa
  de segurança (`HIGH_SECURITY_RISK`) quando não existe razão bloqueante.

### Lint

- Erros de lint exigem revisão (`LINT_ERRORS`) quando não existe razão bloqueante.

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
  `MANDATORY_TEST_FAILURE`, `CRITICAL_SECURITY_VULNERABILITY`),
  a decisão final é `NO_GO`.
- Se não existir razão bloqueante, mas existir uma razão de revisão
  (`COVERAGE_BELOW_MINIMUM` na faixa de review, `LINT_ERRORS`,
  `HIGH_SECURITY_RISK`), a decisão final é `REVIEW`.
- Sem razões, a decisão final é `GO`.

## Tipos de release

A policy aplica-se com thresholds de cobertura diferentes para releases
`standard` e `hotfix`; as restantes regras e precedência mantêm-se.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
