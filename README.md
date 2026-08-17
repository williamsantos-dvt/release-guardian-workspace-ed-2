# Release Guardian — Desafio de Hackathon xTEAM Dev Academy

Bem-vindo à equipa do **Release Guardian**, o serviço interno de release readiness usado pelos pipelines CI/CD da organização. Os pipelines submetem evidências de qualidade (testes, cobertura, segurança, lint) e o Guardian avalia essas evidências contra a release policy em vigor, devolvendo uma decisão auditável: `GO`, `REVIEW` ou `NO_GO`.

> **Este não é um desafio de TypeScript. O TypeScript é apenas o substrato.**
> O desafio é a engenharia à volta da IA: como especificas, curas contexto, delegas e validas mudanças num sistema legado real.

## O que já funciona (baseline)

O starter é um produto funcional. Num clone limpo:

```bash
npm install
npm test        # testes verdes
npm run dev     # API em :3000 + dashboard em :5173
```

Confirma o baseline antes de qualquer alteração:

- [ ] `GET /health` responde `{"status":"ok"}`
- [ ] Documentação OpenAPI/Swagger em `http://localhost:3000/docs`
- [ ] Dashboard em `http://localhost:5173` com histórico seed
- [ ] `npm run simulate:pipeline -- hotfix-release` devolve uma decisão

## Comandos

| Comando | Descrição |
|---|---|
| `npm run dev` | API (Fastify) + dashboard (Vite) em modo dev |
| `npm test` | Suite de testes do projeto |
| `npm run validate` | Validação em camadas: typecheck → lint → testes → coverage → smoke funcional |
| `npm run simulate:pipeline -- <cenário>` | Simulador de pipeline CI (`healthy-release`, `low-coverage`, `critical-security`, `review-security`, `incomplete-evidence`, `hotfix-release`) |
| `npm run typecheck` / `npm run lint` | Verificações individuais |

## A missão

Os detalhes estão no briefing: `docs/challenge-brief.md`. Lê-o antes de abrir o editor.

Em resumo: a release policy precisa de evoluir. Antes de implementar, investiga o sistema — implementação, testes e documentação existentes **podem conter dívida e inconsistências**. Determinar qual contexto é confiável faz parte do desafio.

## Cronologia (4 horas)

| Fase | Duração |
|---|---|
| Apresentação, regras e critérios | 20 min |
| Investigação, baseline e OpenSpec | 30 min |
| Implementação | 60 min |
| **Change request a meio do evento** (anunciado pelo facilitador) | — |
| Adaptação ao change request | 60 min |
| Validação e correções finais | 30 min |
| Commits e pull request | 15 min |
| Discussão coletiva | 20 min |
| Encerramento | 5 min |

## Contrato de entrega

1. Trabalha numa branch `participant/<prefixo-do-email>` (parte antes do `@`).
2. A submissão oficial é um **pull request para `main`**, nunca merged durante o evento.
3. Apenas os commits antes do prazo são avaliados.
4. A mudança OpenSpec (proposal → specs → design → tasks) tem de estar concluída e coerente com o que implementaste — incluindo a adaptação ao change request.
5. Commits incrementais que evidenciem as fases (spec → build → validação).
6. Preenche todas as secções do template do PR.

## Ferramental obrigatório

- **OpenSpec** — captar a intenção em especificação antes de implementar.
- **OpenCode** — orquestrar com os agentes Plan e Build.

Não são necessários agentes personalizados.

## Avaliação

Duas dimensões, sem ranking nem vencedores:

1. **Certificação** (processo): PR no prazo + OpenSpec completo + Plan/Build demonstrável + commits incrementais + validações executadas. Limitações declaradas não bloqueiam a certificação.
2. **Registo de conclusão técnica** (função): Concluído / Parcialmente Concluído / Não Concluído Tecnicamente, com base no validador. Um **Functional Demo Gate** limita a pontuação máxima funcional se a API ou o endpoint principal não funcionarem no final — mas nunca bloqueia a certificação.

A rubrica valoriza o processo (60%) acima da correção funcional (30%), com qualidade e âmbito (10%).

> Não consegues acabar a tempo? Declara a limitação no PR e documenta o que fizeste. Processo honesto e completo certifica; a função é reconhecida, não exigida.

## Estrutura do repositório

```text
apps/
  api/          # API Fastify + policy engine + repositório em memória
  dashboard/    # Dashboard React/Vite (pré-pronto)
packages/
  contracts/    # Contratos partilhados (tipos + JSON Schemas)
scripts/        # Simulador de pipeline e validação
examples/       # Cenários canon do simulador
docs/           # Briefing, política e documentação
openspec/       # Especificações orientadas por mudanças
```
