import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../src/server.js';

const healthyEvidence = {
  releaseId: 'api-test-release',
  releaseType: 'standard',
  tests: { passed: 120, failed: 0 },
  coverage: 88,
  security: { critical: 0, high: 0 },
  lintErrors: 0,
};

let app: Awaited<ReturnType<typeof buildApp>>;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('GET /health', () => {
  it('reports service status', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'release-guardian' });
  });
});

describe('GET /api/v1/policy', () => {
  it('exposes the current policy', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/policy' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({
      policyVersion: '1.4.0',
      minimumCoverage: 65,
      supportedReleaseTypes: ['standard', 'hotfix'],
    });
  });
});

describe('POST /api/v1/evaluations', () => {
  it('evaluates and persists a healthy release', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/evaluations',
      payload: healthyEvidence,
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.decision).toBe('GO');
    expect(body.reasons).toEqual([]);
    expect(body.releaseId).toBe('api-test-release');
    expect(body.evaluationId).toMatch(/^EV-\d{4}$/);
  });

  it('returns REVIEW for a release in the coverage review band', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/evaluations',
      payload: { ...healthyEvidence, releaseId: 'api-review-release', coverage: 75 },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      releaseId: 'api-review-release',
      decision: 'REVIEW',
      reasons: ['COVERAGE_REQUIRES_REVIEW'],
    });
  });

  it('keeps standard coverage of 67 as NO_GO', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/evaluations',
      payload: { ...healthyEvidence, releaseId: 'api-standard-67', coverage: 67 },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      releaseId: 'api-standard-67',
      decision: 'NO_GO',
      reasons: ['COVERAGE_BELOW_MINIMUM'],
    });
  });

  it('evaluates hotfix coverage of 67 as REVIEW (CR-01)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/evaluations',
      payload: {
        ...healthyEvidence,
        releaseId: 'api-hotfix-67',
        releaseType: 'hotfix',
        coverage: 67,
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      releaseId: 'api-hotfix-67',
      decision: 'REVIEW',
      reasons: ['COVERAGE_REQUIRES_REVIEW'],
    });
  });

  it('returns REVIEW for high security risk (>=3) without critical', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/evaluations',
      payload: {
        ...healthyEvidence,
        releaseId: 'api-high-risk-review',
        security: { critical: 0, high: 3 },
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      releaseId: 'api-high-risk-review',
      decision: 'REVIEW',
      reasons: ['HIGH_SECURITY_RISK'],
    });
  });

  it('returns REVIEW for lint errors without blockers', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/evaluations',
      payload: {
        ...healthyEvidence,
        releaseId: 'api-lint-review',
        lintErrors: 3,
      },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      releaseId: 'api-lint-review',
      decision: 'REVIEW',
      reasons: ['LINT_ERRORS'],
    });
  });

  it('rejects an incomplete payload with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/evaluations',
      payload: { releaseId: 'broken' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /api/v1/evaluations', () => {
  it('lists the seeded history', async () => {
    const fresh = await buildApp();
    await fresh.ready();
    const res = await fresh.inject({ method: 'GET', url: '/api/v1/evaluations' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.evaluations.length).toBe(18);
    expect(body.evaluations[0]).toMatchObject({ evaluationId: 'EV-0001' });
    await fresh.close();
  });
});

describe('GET /api/v1/evaluations/:evaluationId', () => {
  it('returns the full evaluation', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/evaluations/EV-0001' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ evaluationId: 'EV-0001', releaseId: 'checkout-api-4.8.2' });
  });

  it('returns 404 for an unknown id', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/evaluations/EV-9999' });
    expect(res.statusCode).toBe(404);
  });
});

describe('GET /api/v1/statistics', () => {
  it('aggregates decisions over the seeded history', async () => {
    const fresh = await buildApp();
    await fresh.ready();
    const res = await fresh.inject({ method: 'GET', url: '/api/v1/statistics' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.total).toBe(18);
    expect(body.byDecision).toEqual({ GO: 10, REVIEW: 4, NO_GO: 4 });
    await fresh.close();
  });
});
