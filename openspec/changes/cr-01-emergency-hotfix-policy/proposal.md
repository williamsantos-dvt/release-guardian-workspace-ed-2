## Why

Os incidentes recentes demonstraram que tratar hotfixes como releases standard
gera atrasos indevidos na mitigação. A policy atual exige os mesmos thresholds
de cobertura para qualquer tipo de release, o que bloqueia hotfixes com
cobertura aceitável para mitigação emergencial sem ganho proporcional de
segurança. Precisamos de uma policy que distinga explicitamente hotfixes de
releases standard, mantendo os mesmos gates de vulnerabilidades e testes
mandatórios, mas ajustando os thresholds de cobertura para hotfix.

## What Changes

- Introdução de um modelo de decisão de cobertura que considera o tipo de
  release (`STANDARD` vs `HOTFIX`) ao aplicar thresholds.
- Definição de novos thresholds de cobertura para releases `HOTFIX`:
  - `< 65`: `NO_GO`
  - `65 – 79.99`: `REVIEW`
  - `>= 80`: sem restrição de cobertura (desde que não haja outros sinais
    de NO_GO/REVIEW).
- Preservação dos thresholds atuais para releases `STANDARD`:
  - `< 70`: `NO_GO`
  - `70 – 79.99`: `REVIEW`
  - `>= 80`: sem restrição de cobertura.
- Manutenção de todas as regras não relacionadas a cobertura:
  - Vulnerabilidades `critical` (> 0): sempre `NO_GO`.
  - Testes mandatórios falhados (> 0): sempre `NO_GO`.
  - Vulnerabilidades `high` (>= 3): sempre `REVIEW`.
  - Erros de lint (> 0): sempre `REVIEW`.
  - Precedência de decisão permanece `NO_GO > REVIEW > GO`.
  - Todas as razões aplicáveis continuam a ser devolvidas na ordem
    estabelecida.
- Ajuste dos cenários de simulação para refletir o novo comportamento,
  garantindo que:
  - Cenário canon `hotfix-release` (hotfix com 67% de cobertura e restantes
    sinais saudáveis) passa de `NO_GO` para `REVIEW`.
  - Uma release `STANDARD` com a mesma cobertura (67%) permanece `NO_GO`.

## Capabilities

### New Capabilities

- `release-policy/hotfix-coverage-thresholds`: Define thresholds específicos de
  cobertura para releases do tipo hotfix, mantendo os mesmos gates de
  vulnerabilidade, testes mandatórios e lint, e garantindo que a decisão final
  (`GO`/`REVIEW`/`NO_GO`) respeita a precedência existente.

### Modified Capabilities

- `release-policy/coverage-evaluation`: A política de avaliação de cobertura
  deixa de ser uniforme entre todos os tipos de release e passa a considerar o
  tipo (`STANDARD` vs `HOTFIX`) ao aplicar thresholds de cobertura, sem alterar
  o contrato HTTP do endpoint principal nem introduzir novas razões de decisão.

## Impact

- Código da policy de decisão de release readiness responsável por avaliar
  cobertura, tipo de release e sinais de qualidade (vulnerabilidades, testes
  mandatórios, lint).
- Cenários de simulação de pipeline, incluindo o cenário canon
  `hotfix-release`, que precisa ser atualizado para refletir a nova decisão
  esperada (`REVIEW`).
- Testes automatizados da policy de cobertura por tipo de release, cobrindo
  tanto `STANDARD` quanto `HOTFIX`, inclusive os thresholds de fronteira (64.99,
  65, 69.99, 70, 79.99, 80).
- Nenhum impacto em:
  - Contrato HTTP do endpoint principal (permanece congelado).
  - Persistência de dados.
  - UI ou flows de interação do utilizador.
  - Conjuntos de razões devolvidas, além das combinações de decisão já
    existentes.
