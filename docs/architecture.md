# Arquitetura — Release Guardian

## Visão geral

O Release Guardian é composto por três partes que comunicam através de contratos
partilhados:

```text
CI/CD Pipeline ──POST /api/v1/evaluations──▶ Fastify API ──▶ Policy Engine
                                                  │
                                                  ▼
                                          Repositório (memória)
                                                  │
                                                  ▼
                                             Dashboard
```

## Componentes

### API (`apps/api`)

Serviço Fastify em TypeScript. Expõe:

- `GET /health` — estado do serviço
- `GET /api/v1/policy` — policy em vigor
- `POST /api/v1/evaluations` — avaliar evidência submetida por um pipeline
- `GET /api/v1/evaluations` — histórico de avaliações
- `GET /api/v1/evaluations/:id` — detalhe auditável de uma avaliação
- `GET /api/v1/statistics` — agregados (contadores por decisão, motivos bloqueantes)

O motor de decisão vive em `apps/api/src/services/releaseService.ts`; os limiares
da policy estão em `apps/api/src/constants.ts`.

### Dashboard (`apps/dashboard`)

React/Vite. Consome exclusivamente a API. Mostra contadores por decisão,
avaliações recentes, detalhe auditável, policy corrente e motivos bloqueantes.

### Simulador de pipeline (`scripts/simulate-pipeline.cjs`)

Reproduz o comportamento de um pipeline CI/CD: executa "etapas", monta a
evidência a partir de um cenário em `examples/` e submete-a ao Guardian.

## Persistência

O histórico de avaliações vive **em memória**. Cada arranque recarrega o
histório seed determinístico (18 avaliações) reavaliado contra a policy corrente.
Uma camada de persistência real está planeada para uma futura iteração.

## Contratos (`packages/contracts`)

Tipos TypeScript e JSON Schemas partilhados por todos os consumidores. O
contrato do endpoint principal está congelado.
