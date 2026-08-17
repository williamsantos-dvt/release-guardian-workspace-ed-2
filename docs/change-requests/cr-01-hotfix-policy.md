# CR-01 — Emergency Hotfix Policy

**Change request entregue pela organização de Engineering Platform.**
**Revelado pelo facilitador às 1:50 do evento.**

## Contexto

Os incidentes recentes mostraram que as equipas precisam de pôr hotfixes em
produção rapidamente, e a policy atual trata hotfixes exatamente como releases
standard. Isso força bloqueios de cobertura que atrasam a mitigação de
incidentes sem ganho real de segurança.

O Release Guardian passa a suportar **thresholds de cobertura distintos por
tipo de release**.

## Requisitos

### Cobertura por tipo de release

**STANDARD** (inalterado):

| Cobertura | Decisão |
|---|---|
| `< 70` | `NO_GO` |
| `70 – 79.99` | `REVIEW` |
| `>= 80` | sem restrição |

**HOTFIX** (novo):

| Cobertura | Decisão |
|---|---|
| `< 65` | `NO_GO` |
| `65 – 79.99` | `REVIEW` |
| `>= 80` | sem restrição |

### Regras que não mudam

- Vulnerabilidades **critical** (> 0) continuam a ser **sempre** `NO_GO`.
- Testes mandatórios falhados (> 0) continuam a ser **sempre** `NO_GO`.
- Vulnerabilidades **high** (>= 3) continuam a ser `REVIEW`.
- Erros de lint (> 0) continuam a ser `REVIEW`.
- Precedência: `NO_GO > REVIEW > GO`.
- Todas as razões aplicáveis continuam a ser devolvidas na ordem estabelecida.

### Restrições

- O contrato HTTP do endpoint principal permanece congelado.
- Sem novos endpoints, sem nova persistência, sem alterações de UI. A mudança
  limita-se à policy e aos seus testes.

## Cenário de aceitação

O cenário canon `hotfix-release` (hotfix com cobertura 67%, restantes sinais
saudáveis) avalia-se assim:

- **Antes do CR-01:** `NO_GO` (`COVERAGE_BELOW_MINIMUM`)
- **Depois do CR-01:** `REVIEW` (cobertura de hotfix em faixa de revisão)

```bash
npm run simulate:pipeline -- hotfix-release
```

Uma release `standard` com a mesma cobertura (67%) continua `NO_GO`.
