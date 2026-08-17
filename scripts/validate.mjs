#!/usr/bin/env node
// Layered local validator. Reports objective pass/fail per layer without
// revealing causes or fix locations. Exit code 0 only if every layer passes.
import { spawn, spawnSync } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const layers = [];
const t0 = Date.now();
const isWindows = process.platform === 'win32';

function quoteArgument(arg) {
  return /[\s"^&|<>]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

function prepareCommand(command, args, forceShell = false) {
  if (!isWindows || !forceShell) {
    return { command, args };
  }
  const joined = [command, ...args].map(quoteArgument).join(' ');
  return { command: 'cmd.exe', args: ['/d', '/s', '/c', joined] };
}

function run(name, command, args) {
  const { command: program, args: finalArgs } = prepareCommand(command, args, isWindows);
  const res = spawnSync(program, finalArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
  const ok = res.status === 0;
  const out = (res.stdout?.toString() ?? '') + (res.stderr?.toString() ?? '');
  layers.push({ name, ok, tail: out.trim().split('\n').slice(-3).join('\n') });
}

console.log('Release Guardian — validação local em camadas\n');

console.log('[1/5] typecheck ...');
run('typecheck', 'npm', ['run', 'typecheck']);

console.log('[2/5] lint ...');
run('lint', 'npm', ['run', 'lint']);

console.log('[3/5] testes ...');
run('testes', 'npm', ['test']);

console.log('[4/5] coverage ...');
run('coverage', 'npx', ['vitest', 'run', '--coverage']);

console.log('[5/5] smoke funcional ...');
{
  const PORT = 3199;
  const base = `http://127.0.0.1:${PORT}`;
  const { command: spawnCommand, args: spawnArgs } = prepareCommand(
    'npx',
    ['tsx', 'apps/api/src/index.ts'],
    isWindows
  );
  const server = spawn(spawnCommand, spawnArgs, {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let spawnError = null;
  server.on('error', (error) => {
    spawnError = error;
  });
  let ok = true;
  const detail = [];
  try {
    if (spawnError) {
      ok = false;
      detail.push(`falha ao iniciar API: ${spawnError.message}`);
    }
    let up = false;
    for (let i = 0; i < 40 && !up; i++) {
      if (spawnError) {
        break;
      }
      await delay(250);
      try {
        const res = await fetch(`${base}/health`);
        up = res.ok;
      } catch {
        /* still booting */
      }
    }
    if (!up) {
      ok = false;
      detail.push('a API não arrancou');
    } else {
      const healthy = await (
        await fetch(`${base}/api/v1/evaluations`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            releaseId: 'smoke-check',
            releaseType: 'standard',
            tests: { passed: 10, failed: 0 },
            coverage: 90,
            security: { critical: 0, high: 0 },
            lintErrors: 0,
          }),
        })
      ).json();
      if (typeof healthy.decision !== 'string' || !Array.isArray(healthy.reasons)) {
        ok = false;
        detail.push('resposta do endpoint principal com forma inesperada');
      }
      const bad = await fetch(`${base}/api/v1/evaluations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseId: 'smoke-check' }),
      });
      if (bad.status !== 400) {
        ok = false;
        detail.push('evidência inválida não foi rejeitada com 400');
      }
      const history = await (await fetch(`${base}/api/v1/evaluations`)).json();
      if (!Array.isArray(history.evaluations) || history.evaluations.length < 19) {
        ok = false;
        detail.push('histórico seed não presente após avaliação');
      }
    }
  } catch (e) {
    ok = false;
    detail.push(`erro inesperado: ${e.message}`);
  } finally {
    if (server.pid) {
      server.kill('SIGTERM');
    }
  }
  layers.push({ name: 'smoke funcional', ok, tail: detail.join('; ') });
}

console.log('');
const failed = layers.filter((l) => !l.ok);
for (const l of layers) {
  console.log(`${l.ok ? '✓' : '✗'} ${l.name}${l.ok ? '' : `\n    ${l.tail}`}`);
}
const seconds = ((Date.now() - t0) / 1000).toFixed(1);
console.log(
  `\n${failed.length === 0 ? 'VALIDAÇÃO COMPLETA: PASS' : `VALIDAÇÃO: FAIL (${failed.length} camada(s) falharam)`} — ${seconds}s`
);
process.exit(failed.length === 0 ? 0 : 1);
