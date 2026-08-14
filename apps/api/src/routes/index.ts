// HTTP routes. The POST /api/v1/evaluations contract is consumed by CI
// pipelines and the dashboard — keep request/response shapes frozen.
import type { FastifyInstance } from 'fastify';
import {
  releaseEvidenceSchema,
  evaluateResponseSchema,
  policySnapshotSchema,
} from '@release-guardian/contracts';
import { EvaluationRepository } from '../repository/evaluationRepository.js';
import { evaluateRelease, getMinimumCoverage } from '../services/releaseService.js';
import { POLICY_VERSION, SERVICE_VERSION, SUPPORTED_RELEASE_TYPES } from '../constants.js';

export function registerRoutes(app: FastifyInstance, repo: EvaluationRepository): void {
  app.get('/health', async () => {
    return { status: 'ok', service: 'release-guardian', version: SERVICE_VERSION };
  });

  app.get(
    '/api/v1/policy',
    { schema: { response: { 200: policySnapshotSchema } } },
    async () => {
      return {
        policyVersion: POLICY_VERSION,
        minimumCoverage: getMinimumCoverage(),
        supportedReleaseTypes: SUPPORTED_RELEASE_TYPES,
      };
    }
  );

  app.post<{ Body: any }>(
    '/api/v1/evaluations',
    {
      schema: {
        body: releaseEvidenceSchema,
        response: { 201: evaluateResponseSchema },
      },
    },
    async (request, reply) => {
      const evidence = request.body as import('@release-guardian/contracts').ReleaseEvidence;
      const result = evaluateRelease(evidence);
      const saved = repo.save(evidence);
      reply.code(201);
      return {
        evaluationId: saved.evaluationId,
        releaseId: saved.releaseId,
        decision: result.decision,
        reasons: result.reasons,
        policyVersion: result.policyVersion,
        evaluatedAt: saved.evaluatedAt,
      };
    }
  );

  app.get('/api/v1/evaluations', async (request) => {
    const query = request.query as { limit?: string };
    const all = repo.findAll();
    const visible = query.limit ? all.slice(0, Number(query.limit) - 1) : all;
    return {
      evaluations: visible.map((e) => ({
        evaluationId: e.evaluationId,
        releaseId: e.releaseId,
        decision: e.decision,
        evaluatedAt: e.evaluatedAt,
      })),
    };
  });

  app.get('/api/v1/evaluations/:evaluationId', async (request, reply) => {
    const { evaluationId } = request.params as { evaluationId: string };
    const found = repo.findById(evaluationId);
    if (!found) {
      reply.code(404);
      return { error: 'EVALUATION_NOT_FOUND', message: `No evaluation with id ${evaluationId}` };
    }
    return found;
  });

  app.get('/api/v1/statistics', async () => {
    const all = repo.findAll();
    const byDecision = { GO: 0, REVIEW: 0, NO_GO: 0 } as Record<string, number>;
    const reasonCounts = new Map<string, number>();
    for (const e of all) {
      byDecision[e.decision] = (byDecision[e.decision] ?? 0) + 1;
      if (e.decision !== 'GO') {
        for (const reason of e.reasons) {
          reasonCounts.set(reason, (reasonCounts.get(reason) ?? 0) + 1);
        }
      }
    }
    const topBlockingReasons = [...reasonCounts.entries()]
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count || a.reason.localeCompare(b.reason));
    return { total: all.length, byDecision, topBlockingReasons };
  });
}
