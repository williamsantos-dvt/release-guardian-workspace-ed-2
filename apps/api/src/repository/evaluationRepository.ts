// In-memory evaluation history. Restarts are non-destructive by design:
// every boot re-evaluates the seed evidence against the current policy,
// so the history always reflects what the policy would decide today.
import type { ReleaseEvidence, ReleaseEvaluation } from '@release-guardian/contracts';
import { evaluateRelease } from '../services/releaseService.js';
import { SEED_EVALUATIONS } from '../seeds/seedData.js';

export class EvaluationRepository {
  private evaluations: ReleaseEvaluation[] = [];
  private nextId: number;

  constructor() {
    this.nextId = 1;
    for (const seed of SEED_EVALUATIONS) {
      const evaluation = this.evaluateAndPersist(seed.evidence, seed.evaluatedAt);
      // keep deterministic seed ids (EV-0001..EV-0018) instead of counter ids
      evaluation.evaluationId = seed.evaluationId;
    }
    this.nextId = SEED_EVALUATIONS.length + 1;
  }

  private evaluateAndPersist(evidence: ReleaseEvidence, evaluatedAt: string): ReleaseEvaluation {
    const result = evaluateRelease(evidence);
    const evaluation: ReleaseEvaluation = {
      evaluationId: this.makeId(),
      releaseId: evidence.releaseId,
      decision: result.decision,
      reasons: result.reasons,
      policyVersion: result.policyVersion,
      evidence,
      evaluatedAt,
    };
    this.evaluations.push(evaluation);
    return evaluation;
  }

  private makeId(): string {
    const id = 'EV-' + String(this.nextId).padStart(4, '0');
    this.nextId++;
    return id;
  }

  save(evidence: ReleaseEvidence): ReleaseEvaluation {
    return this.evaluateAndPersist(evidence, new Date().toISOString());
  }

  findAll(): ReleaseEvaluation[] {
    return [...this.evaluations];
  }

  findById(evaluationId: string): ReleaseEvaluation | undefined {
    return this.evaluations.find((e) => e.evaluationId === evaluationId);
  }
}
