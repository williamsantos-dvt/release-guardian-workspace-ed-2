import { useEffect, useState } from 'react';
import type { Decision } from '@release-guardian/contracts';
import {
  fetchStatistics,
  fetchPolicy,
  fetchEvaluations,
  fetchEvaluation,
  submitEvidence,
} from './api';
import type { PolicySnapshot, ReleaseStatistics, EvaluationSummary, ReleaseEvaluation } from '@release-guardian/contracts';

const DECISIONS: Decision[] = ['GO', 'REVIEW', 'NO_GO'];

function DecisionBadge({ decision }: { decision: string }) {
  // Renders any decision value; unknown values degrade to a neutral badge
  // instead of breaking the dashboard.
  const known = DECISIONS.includes(decision as Decision);
  const cls = known ? `badge badge-${decision}` : 'badge badge-UNKNOWN';
  const label = known ? decision : `${decision} (?)`;
  return <span className={cls}>{label}</span>;
}

function App() {
  const [stats, setStats] = useState<ReleaseStatistics | null>(null);
  const [policy, setPolicy] = useState<PolicySnapshot | null>(null);
  const [evaluations, setEvaluations] = useState<EvaluationSummary[]>([]);
  const [selected, setSelected] = useState<ReleaseEvaluation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    releaseId: '',
    releaseType: 'standard' as 'standard' | 'hotfix',
    passed: 100,
    failed: 0,
    coverage: 80,
    critical: 0,
    high: 0,
    lintErrors: 0,
  });
  const [lastResult, setLastResult] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [s, p, e] = await Promise.all([
        fetchStatistics(),
        fetchPolicy(),
        fetchEvaluations(),
      ]);
      setStats(s);
      setPolicy(p);
      setEvaluations(e.evaluations.slice().reverse());
      setError(null);
    } catch {
      setError('Não foi possível contactar a API do Release Guardian.');
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openEvaluation = async (id: string) => {
    try {
      setSelected(await fetchEvaluation(id));
    } catch {
      setError(`Não foi possível carregar a avaliação ${id}.`);
    }
  };

  const evaluate = async () => {
    const evidence = {
      releaseId: form.releaseId || 'manual-release',
      releaseType: form.releaseType,
      tests: { passed: Number(form.passed), failed: Number(form.failed) },
      coverage: Number(form.coverage),
      security: { critical: Number(form.critical), high: Number(form.high) },
      lintErrors: Number(form.lintErrors),
    };
    const result = await submitEvidence(evidence);
    if (result.ok) {
      setLastResult(`${result.body.decision} — razões: ${
        result.body.reasons.length ? result.body.reasons.join(', ') : 'nenhuma'
      }`);
      await refresh();
    } else {
      setLastResult(`Erro: a API respondeu ${result.status} (evidência inválida?)`);
    }
  };

  return (
    <main className="app">
      <header className="header">
        <h1>Release Guardian</h1>
        <span className="policy-version">
          Policy v{policy?.policyVersion ?? '…'}
        </span>
      </header>

      {error && <div className="error">{error}</div>}

      <section className="section">
        <h2>Release Readiness</h2>
        <div className="counters">
          {DECISIONS.map((d) => (
            <div key={d} className={`counter counter-${d}`}>
              <span className="counter-value">{stats?.byDecision[d] ?? 0}</span>
              <span className="counter-label">{d}</span>
            </div>
          ))}
        </div>
        <p className="muted">Total de avaliações: {stats?.total ?? '…'}</p>
      </section>

      <div className="columns">
        <section className="section">
          <h2>Avaliações Recentes</h2>
          <table>
            <thead>
              <tr>
                <th>Release</th>
                <th>Avaliação</th>
                <th>Decisão</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((e) => (
                <tr key={e.evaluationId} onClick={() => openEvaluation(e.evaluationId)}>
                  <td>{e.releaseId}</td>
                  <td className="muted">{e.evaluationId}</td>
                  <td>
                    <DecisionBadge decision={e.decision} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="section">
          <h2>Motivos Bloqueantes</h2>
          <ul className="reasons">
            {(stats?.topBlockingReasons ?? []).map((r) => (
              <li key={r.reason}>
                <span className="reason-count">{r.count}</span> {r.reason}
              </li>
            ))}
            {!stats?.topBlockingReasons.length && (
              <li className="muted">Sem bloqueios registados.</li>
            )}
          </ul>

          <h2>Policy Corrente</h2>
          <ul className="reasons">
            <li>Cobertura mínima: {policy?.minimumCoverage ?? '…'}%</li>
            <li>
              Tipos suportados: {policy?.supportedReleaseTypes.join(', ') ?? '…'}
            </li>
          </ul>
        </section>
      </div>

      <section className="section">
        <h2>Avaliar Release Manualmente</h2>
        <div className="form">
          <label>
            Release ID
            <input
              value={form.releaseId}
              onChange={(e) => setForm({ ...form, releaseId: e.target.value })}
              placeholder="ex.: payments-api-8.2.0"
            />
          </label>
          <label>
            Tipo
            <select
              value={form.releaseType}
              onChange={(e) =>
                setForm({ ...form, releaseType: e.target.value as 'standard' | 'hotfix' })
              }
            >
              <option value="standard">standard</option>
              <option value="hotfix">hotfix</option>
            </select>
          </label>
          <label>
            Testes passados
            <input
              type="number"
              min={0}
              value={form.passed}
              onChange={(e) => setForm({ ...form, passed: Number(e.target.value) })}
            />
          </label>
          <label>
            Testes falhados
            <input
              type="number"
              min={0}
              value={form.failed}
              onChange={(e) => setForm({ ...form, failed: Number(e.target.value) })}
            />
          </label>
          <label>
            Cobertura (%)
            <input
              type="number"
              step="0.01"
              min={0}
              max={100}
              value={form.coverage}
              onChange={(e) => setForm({ ...form, coverage: Number(e.target.value) })}
            />
          </label>
          <label>
            Vulnerabilidades critical
            <input
              type="number"
              min={0}
              value={form.critical}
              onChange={(e) => setForm({ ...form, critical: Number(e.target.value) })}
            />
          </label>
          <label>
            Vulnerabilidades high
            <input
              type="number"
              min={0}
              value={form.high}
              onChange={(e) => setForm({ ...form, high: Number(e.target.value) })}
            />
          </label>
          <label>
            Erros de lint
            <input
              type="number"
              min={0}
              value={form.lintErrors}
              onChange={(e) => setForm({ ...form, lintErrors: Number(e.target.value) })}
            />
          </label>
          <button onClick={evaluate}>Avaliar Release</button>
        </div>
        {lastResult && <p className="result">{lastResult}</p>}
      </section>

      {selected && (
        <section className="section detail" onClick={() => setSelected(null)}>
          <h2>{selected.releaseId}</h2>
          <p>
            <DecisionBadge decision={selected.decision} />
          </p>
          <h3>Evidência</h3>
          <ul className="reasons">
            <li>Tipo: {selected.evidence.releaseType}</li>
            <li>
              Testes: {selected.evidence.tests.passed} passados /{' '}
              {selected.evidence.tests.failed} falhados
            </li>
            <li>Cobertura: {selected.evidence.coverage}%</li>
            <li>
              Segurança: {selected.evidence.security.critical} critical /{' '}
              {selected.evidence.security.high} high
            </li>
            <li>Lint: {selected.evidence.lintErrors} erros</li>
          </ul>
          <h3>Razões da Decisão</h3>
          <ul className="reasons">
            {selected.reasons.length ? (
              selected.reasons.map((r) => <li key={r}>⚠ {r}</li>)
            ) : (
              <li className="muted">Nenhuma — release sem restrições.</li>
            )}
          </ul>
          <p className="muted">
            Avaliada com Policy v{selected.policyVersion} · {selected.evaluationId} ·{' '}
            {new Date(selected.evaluatedAt).toLocaleString('pt-PT')} · (clique para fechar)
          </p>
        </section>
      )}

      <footer className="footer muted">
        Release Guardian — serviço interno de release readiness. Documentação da API:{' '}
        <a href="http://localhost:3000/docs" target="_blank" rel="noreferrer">
          /docs
        </a>
      </footer>
    </main>
  );
}

export default App;
