## Tasks para introduzir REVIEW

1. **Contratos e tipos**
   - Atualizar `packages/contracts` para aceitar `decision: 'GO' | 'REVIEW' | 'NO_GO'`.
   - Gerar testes de schema que validem payloads `REVIEW`.

2. **Policy engine**
   - Refatorar `evaluateRelease` para distinguir razões bloqueantes vs revisão.
   - Documentar e codificar `TARGET_COVERAGE` (ex.: 85) enquanto `MINIMUM_COVERAGE` permanece em 70.

3. **Rotas / estatísticas / policy snapshot**
   - Garantir que `/api/v1/policy` expõe `supportedDecisions` + limiares atualizados.
   - `GET /api/v1/statistics` deve reportar `byDecision.REVIEW` e novas razões.

4. **Simulador / exemplos**
   - Criar `examples/review-coverage.json` e `examples/review-security.json`.
   - Atualizar `scripts/simulate-pipeline.cjs` para mensagens específicas de `REVIEW`.

5. **Testes e cobertura**
   - Adicionar testes unitários/integration API para `GO`, `REVIEW`, `NO_GO`.
   - Cobertura: manter reports com 100% statements/lines e >90% branches.
   - Garantir `npm run validate` passa e que o smoke verifica o novo comportamento.

6. **Docs e harness**
   - Atualizar `docs/release-policy.md` e `docs/architecture.md` para incluir `REVIEW`.
   - Escrever AGENTS.md/harness atualizado com comandos, restrições e spec final.

7. **Plan → Build**
   - Cada task é pequena o suficiente para ser implementada por um agente Build: editar ficheiros específicos, correr comandos (`npm test`, `npm run coverage`, `npm run validate`, `npm run simulate:pipeline`), validar a saída e reportar.
