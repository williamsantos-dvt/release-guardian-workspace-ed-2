## Purpose

Define os thresholds de cobertura específicos para releases do tipo HOTFIX,
garantindo que incidentes críticos possam ser mitigados rapidamente sem
relaxar os gates de segurança e qualidade existentes (vulnerabilidades,
testes mandatórios e lint), e mantendo a precedência e o modelo de decisões
(`NO_GO`, `REVIEW`, `GO`) consistentes com a policy standard.

## ADDED Requirements

### Requirement: Hotfix coverage thresholds

A policy de release readiness SHALL aplicar thresholds de cobertura distintos
para releases do tipo HOTFIX, mantendo inalteradas as regras para sinais de
segurança e qualidade (vulnerabilidades, testes mandatórios, lint) e a
precedência de decisão.

#### Scenario: Hotfix coverage below 65

- **WHEN** a release é do tipo `HOTFIX`
- **AND** a cobertura de testes é estritamente inferior a 65%
- **AND** não há vulnerabilidades `critical`
- **AND** não há testes mandatórios falhados
- **AND** as vulnerabilidades `high` são abaixo do threshold de `REVIEW`
- **AND** não há erros de lint
- **THEN** a decisão de cobertura SHALL ser `NO_GO`
- **AND** a razão `COVERAGE_BELOW_MINIMUM` SHALL ser incluída na lista de
  razões
- **AND** a decisão global SHALL ser `NO_GO` (respeitando a precedência
  sobre qualquer motivo de `REVIEW` ou `GO`).

#### Scenario: Hotfix coverage between 65 and 79.99

- **WHEN** a release é do tipo `HOTFIX`
- **AND** a cobertura de testes é maior ou igual a 65% e menor ou igual a
  79.99%
- **AND** não há vulnerabilidades `critical`
- **AND** não há testes mandatórios falhados
- **AND** as vulnerabilidades `high` são abaixo do threshold de `REVIEW`
- **AND** não há erros de lint
- **THEN** a decisão de cobertura SHALL ser `REVIEW`
- **AND** a razão de cobertura SHALL indicar que a cobertura do hotfix está na
  faixa de revisão
- **AND** a decisão global SHALL ser `REVIEW` (a menos que outro sinal
  promova `NO_GO`).

#### Scenario: Hotfix coverage at least 80

- **WHEN** a release é do tipo `HOTFIX`
- **AND** a cobertura de testes é maior ou igual a 80%
- **AND** não há vulnerabilidades `critical`
- **AND** não há testes mandatórios falhados
- **AND** as vulnerabilidades `high` são abaixo do threshold de `REVIEW`
- **AND** não há erros de lint
- **THEN** a decisão de cobertura SHALL não impor qualquer restrição adicional
- **AND** nenhuma razão de `COVERAGE_BELOW_MINIMUM` SHALL ser devolvida
- **AND** a decisão global SHALL ser `GO`, salvo outros sinais que forcem
  `REVIEW` ou `NO_GO` (por precedência).
