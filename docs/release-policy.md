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

### Sinais de revisão (sem bloqueio duro)

Sem bloqueios duros, os seguintes sinais elevam a decisão para `REVIEW`:

- `security.high >= 3` -> `HIGH_SECURITY_RISK`
- `lintErrors > 0` -> `LINT_ERRORS`

### Cobertura (apenas sem bloqueios duros)

Thresholds por tipo de release:

- `standard`
  - `coverage >= 80` -> sem restrição de cobertura
  - `70 <= coverage < 80` -> `REVIEW`
  - `coverage < 70` -> `NO_GO`
- `hotfix`
  - `coverage >= 80` -> `GO`
  - `65 <= coverage < 80` -> `REVIEW`
  - `coverage < 65` -> `NO_GO`

Quando a cobertura estiver em faixa de revisão, inclui-se `COVERAGE_BELOW_MINIMUM`.
Em `REVIEW`, todas as razões aplicáveis são devolvidas (cobertura, high risk, lint), respeitando precedência final `NO_GO > REVIEW > GO`.

### Testes

- Qualquer teste mandatório falhado bloqueia a release (`MANDATORY_TEST_FAILURE`).

### Segurança

- Vulnerabilidade **critical** bloqueia a release (`CRITICAL_SECURITY_VULNERABILITY`).
- Vulnerabilidade **high** com valor `>= 3` eleva para revisão (`HIGH_SECURITY_RISK`) quando não há bloqueio duro.

### Lint

- Erros de lint elevam para revisão (`LINT_ERRORS`) quando não há bloqueio duro.

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
com `hotfix` mais permissivo para mitigação de incidentes (CR-01).

## Cenário CR-01

No cenário canónico `hotfix-release` (hotfix com cobertura `67` e restantes
sinais saudáveis), o resultado esperado é `REVIEW`.

```bash
npm run simulate:pipeline -- hotfix-release
```

Uma release `standard` com cobertura `67` continua a resultar em `NO_GO`.

## Contrato da API

O contrato de `POST /api/v1/evaluations` está congelado: pipelines em produção
dependem dele. Evoluções da policy não podem alterar o pedido nem a forma da
resposta.
