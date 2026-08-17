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

- A policy usa limiares por tipo de release:

| Tipo | Cobertura | Decisão base |
|---|---|---|
| `standard` | `< 70` | `NO_GO` |
| `standard` | `>= 70` | sem restrição por cobertura |
| `hotfix` | `< 65` | `NO_GO` |
| `hotfix` | `65 – 79.99` | `REVIEW` |
| `hotfix` | `>= 80` | sem restrição por cobertura |

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Qualquer vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).

### Lint

- Erros de lint bloqueiam a release (`LINT_ERRORS`).

### Precedência

- A decisão final aplica precedência: `NO_GO > REVIEW > GO`.
- Sinais bloqueantes (testes falhados, critical, lint) prevalecem sobre decisão
  base derivada da cobertura.

## Ordem das razões

Quando várias regras se aplicam, todas as razões são devolvidas pela seguinte
ordem:

1. `COVERAGE_BELOW_MINIMUM`
2. `MANDATORY_TEST_FAILURE`
3. `CRITICAL_SECURITY_VULNERABILITY`
4. `LINT_ERRORS`

## Tipos de release

A policy diferencia releases `standard` e `hotfix` apenas nos limiares de cobertura.

## Cenário canónico de hotfix

- `hotfix-release` (coverage 67, restantes sinais saudáveis) resulta em `REVIEW`.
- Uma release `standard` com coverage 67 continua `NO_GO`.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
