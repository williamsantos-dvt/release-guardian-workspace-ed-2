# Instrução — Guardrails

Limites duros. Ultrapassá-los invalida trabalho correto.

## Congelado

- **Request e resposta de `POST /api/v1/evaluations`.** `ReleaseEvidence` e `EvaluateResponse` em `packages/contracts/src/index.ts` são contrato público consumido por pipelines em produção. Não adicionar, remover nem renomear campos; não mudar códigos de estado (201 em sucesso, 400 em evidência inválida).
- **`Decision = 'GO' | 'REVIEW' | 'NO_GO'`.** Já existe no contrato e nos JSON Schemas. Não introduzir outros vereditos.
- **Formato `evaluationId`:** `EV-\d{4}` (fixado por teste).
- **Validação na fronteira HTTP:** `releaseEvidenceSchema` com `additionalProperties: false` e `coerceTypes: false`. Evidência inválida é rejeitada com 400 e **não é persistida**.

## Área de implementação vs. observação

| Zona | Pode mudar? |
|---|---|
| `apps/api/src/**` | Sim — é aqui que se trabalha |
| `packages/contracts/src/**` | Só aditivamente e só quando a spec o exigir (ex.: novo reason code) |
| `apps/api/test/**` | Sim, com justificação escrita na spec |
| `apps/dashboard/**` | **Não** — instrumento de observação |
| `scripts/simulate-pipeline.cjs` | **Não** — instrumento de observação |
| `scripts/validate.mjs` | **Não** — é o validador que te avalia |
| `docs/challenge-brief.md`, `.github/**` | **Não** (o PR template preenche-se no PR) |

O dashboard e o simulador já renderizam `REVIEW`. Se uma mudança correta na API não aparecer lá, o problema está na API — não no consumidor.

## Proibições

- **Sem novas dependências** (npm), persistência externa, base de dados, Docker ou serviços adicionais sem justificação forte e declarada.
- **Sem reescritas.** É um sistema legado em produção; alterações cirúrgicas e localizadas.
- **Sem correções oportunistas.** Encontraste um bug fora do âmbito da tarefa? Registá-lo em `docs/baseline-findings.md` e continuar. Corrigir de passagem contamina o diff e a spec.
- **Sem resolver divergências por iniciativa própria.** Ver hierarquia de confiança em `AGENTS.md`.

## Segredos

`.opencode/azure.token` contém a chave de acesso ao modelo. **Nunca** commitar, imprimir, copiar para outro ficheiro nem incluir em output. O ficheiro de referência versionado é `azure.token.sample`.

Antes de cada commit: `git status --short` não deve listar `azure.token`.

## Git e entrega

- Branch: `participant/fabiocarmo-dvt`. Não trabalhar em `main`.
- Submissão: **PR para `main`, nunca merged**. Só contam commits antes do prazo.
- Commits incrementais que evidenciem as fases: investigação → spec (OpenSpec) → build → validação.
- A mudança OpenSpec em `openspec/changes/<nome>/` faz parte da entrega e tem de ficar coerente com o código, incluindo a adaptação ao change request.
- Preencher todas as secções de `.github/pull_request_template.md`. Limitações declaradas honestamente não bloqueiam a certificação; "done" falso, sim.
