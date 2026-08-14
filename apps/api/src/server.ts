// App factory — used by the server entrypoint and by the test suite (inject).
import Fastify from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { EvaluationRepository } from './repository/evaluationRepository.js';
import { registerRoutes } from './routes/index.js';
import { SERVICE_VERSION } from './constants.js';

export async function buildApp() {
  const app = Fastify({
    logger: false,
    // Body validation must be strict: `null` or wrongly-typed fields are
    // rejected with 400 at the HTTP boundary instead of being coerced.
    ajv: { customOptions: { coerceTypes: false } },
  });

  await app.register(cors, { origin: true });

  await app.register(swagger, {
    openapi: {
      info: {
        title: 'Release Guardian API',
        description:
          'Deployment readiness service. CI pipelines submit release evidence; the Guardian evaluates it against the release policy and returns an auditable GO / REVIEW / NO_GO decision.',
        version: SERVICE_VERSION,
      },
    },
  });

  await app.register(swaggerUi, { routePrefix: '/docs' });

  const repo = new EvaluationRepository();
  registerRoutes(app, repo);

  return app;
}
