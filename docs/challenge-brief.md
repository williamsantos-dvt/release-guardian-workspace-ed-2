# Briefing do Desafio — Release Guardian

## A situação

Junta-te à equipa responsável pelo **Release Guardian**, um serviço interno usado pelos pipelines CI/CD para determinar se uma release está pronta para produção. A aplicação está a correr em produção e não pode simplesmente ser reescrita.

O fluxo é simples:

```text
CI/CD Pipeline ──evidência──▶ Release Guardian ──decisão──▶ GO / REVIEW / NO_GO
```

O Guardian **não produz evidências** — não executa testes nem scans. Os pipelines submetem evidências (`releaseId`, tipo de release, testes, cobertura, vulnerabilidades, erros de lint) via `POST /api/v1/evaluations`, e o Guardian aplica a release policy em vigor e devolve uma decisão auditável com as razões.

## O estado atual

O sistema funciona. Sobe, decide, guarda histórico e alimenta o dashboard. **Mas é um sistema legado.** Sabe-se que contém dívida técnica e inconsistências entre a implementação, os testes e a documentação existentes. **Ninguém te vai dizer onde.**

> Antes de alterar o sistema, determina qual das fontes pode ser confiável: implementação, testes ou documentação. Não peças à IA simplesmente para implementar a feature — primeiro descobre em que sistema estás a mexer.

## A missão

A release policy precisa de evoluir. A organização quer introduzir o veredito `REVIEW`: releases que não merecem bloqueio, mas exigem aprovação manual antes do deploy. Hoje o sistema só sabe `GO` ou `NO_GO`.

Os requisitos da nova policy serão dados pelo facilitador no arranque da fase de implementação. **Um change request adicional será revelado a meio do evento** — planeia ter margem para adaptar.

## O fluxo de trabalho esperado

Este hackathon avalia **como trabalhas com IA**, não quanto código escreves:

1. **Investiga antes de implementar.** Baseline, caminho de decisão, testes existentes, contradições entre fontes. Pede à IA para analisar e reportar — sem alterar código.
2. **Especifica antes de delegar.** Usa o OpenSpec para transformar a intenção em requisitos verificáveis (a mudança OpenSpec faz parte da entrega).
3. **Cura contexto.** Constrói um harness (AGENTS.md, instruções, ficheiros relevantes) que reduza o que a IA precisa de redescobrir.
4. **Delega tarefas delimitadas.** OpenCode Plan → Build sobre a tua especificação.
5. **Valida independentemente.** Não confies no "done" da IA: `npm run validate`, review contra os critérios da OpenSpec, demo funcional no dashboard/simulador.
6. **Reflete.** O que a IA entendeu errado? O que faltou no harness?

## Regras

- Trabalho individual, na tua branch `participant/<prefixo-do-email>`.
- Submissão = PR para `main`, nunca merged. Apenas commits antes do prazo contam.
- OpenSpec + OpenCode obrigatórios e observáveis nos artefactos e commits.
- O dashboard e o simulador de pipeline são instrumentos de observação — **não são área de implementação**. O contrato da API garante que as tuas mudanças aparecem neles automaticamente.
- Não introduzas persistência externa, bases de dados, Docker ou dependências novas sem justificação forte.

## Como observar o sistema

- **Dashboard:** `npm run dev` e abre `http://localhost:5173` (contadores, avaliações recentes, detalhe auditável, policy corrente, motivos bloqueantes).
- **Swagger:** `http://localhost:3000/docs` — todos os endpoints executáveis no browser.
- **Simulador:** `npm run simulate:pipeline -- <cenário>` — o mesmo caminho que um pipeline real.
- **Exemplos:** `examples/*.json` documentam comportamentos esperados.

Boa sorte — e lembra-te: o código é evidência; o processo é o que está a ser avaliado.
