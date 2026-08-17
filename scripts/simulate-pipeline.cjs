#!/usr/bin/env node
// CI/CD Pipeline Simulator — feeds the Release Guardian the way a real
// pipeline would: run "stages", assemble evidence, POST it, report the
// outcome. Usage:
//   npm run simulate:pipeline                  # healthy scenario
//   npm run simulate:pipeline -- review-security  # any examples/*.json name
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');

const API = process.env.GUARDIAN_URL ?? 'http://localhost:3000';
const scenario = process.argv[2] ?? 'healthy-release';
const scenarioFile = resolve(__dirname, '..', 'examples', `${scenario}.json`);

function stage(name, detail) {
  console.log(`  ✓ ${name}${detail ? ` — ${detail}` : ''}`);
}

async function main() {
  let evidence;
  try {
    evidence = JSON.parse(readFileSync(scenarioFile, 'utf8'));
  } catch {
    console.error(`Cenário desconhecido: "${scenario}" (esperado um ficheiro examples/${scenario}.json)`);
    process.exit(2);
  }

  console.log('╭─────────────────────────────────────────╮');
  console.log('│ CI/CD Pipeline Simulator                │');
  console.log('╰─────────────────────────────────────────╯');
  console.log();
  console.log(`Cenário: ${scenario}`);
  console.log(`Release: ${evidence.releaseId ?? '(desconhecida)'}`);
  console.log();
  console.log('Etapas do pipeline:');
  stage('Build', 'artefactos gerados');
  stage(
    'Testes',
    evidence.tests ? `${evidence.tests.passed} passados / ${evidence.tests.failed} falhados` : 'sem dados'
  );
  stage('Cobertura', `${evidence.coverage ?? 'n/d'}%`);
  stage(
    'Segurança',
    evidence.security ? `${evidence.security.critical} critical / ${evidence.security.high} high` : 'sem dados'
  );
  stage('Lint', `${evidence.lintErrors ?? 'n/d'} erros`);
  console.log();
  console.log(`A enviar evidência para o Release Guardian (${API}/api/v1/evaluations)...`);
  console.log();

  let res;
  try {
    res = await fetch(`${API}/api/v1/evaluations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evidence),
    });
  } catch {
    console.error('✗ Não foi possível contactar o Release Guardian. A API está a correr? (npm run dev:api)');
    process.exit(2);
  }

  if (res.status === 400) {
    console.log('Resposta do Guardian: 400 Bad Request');
    console.log();
    console.log('✗ Evidência inválida — rejeitada na fronteira HTTP. Nada foi persistido.');
    console.log('  O pipeline falha: corrigir o relatório de evidências antes de reenviar.');
    process.exit(1);
  }

  const decision = await res.json();
  console.log(`Resposta do Guardian (${decision.evaluationId}, policy v${decision.policyVersion}):`);
  console.log();
  console.log(`  Decisão: ${decision.decision}`);
  if (decision.reasons.length) {
    console.log('  Razões:');
    for (const reason of decision.reasons) console.log(`    ⚠ ${reason}`);
  } else {
    console.log('  Razões: nenhuma');
  }
  console.log();

  if (decision.decision === 'GO') {
    console.log('✓ Release aprovada para deployment.');
  } else if (decision.decision === 'REVIEW') {
    console.log('⚠ Release requer aprovação manual antes do deployment.');
  } else {
    console.log('✗ Release bloqueada — o pipeline falha.');
    process.exit(1);
  }
}

main();
