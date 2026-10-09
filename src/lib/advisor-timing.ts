/** Lightweight, content-free timing for the two Build Advisor request paths. */
export class AdvisorTiming {
  private readonly startedAt = performance.now();
  private readonly marks: Record<string, number> = {};

  constructor(private readonly path: 'recommendation' | 'critique') {}

  mark(stage: string) {
    this.marks[stage] = Math.round(performance.now() - this.startedAt);
  }

  finish(outcome: 'cache_hit' | 'generated' | 'error', details: Record<string, string | number | boolean | undefined> = {}) {
    console.info('[Build Advisor Timing]', JSON.stringify({
      path: this.path,
      outcome,
      totalMs: Math.round(performance.now() - this.startedAt),
      marksMs: this.marks,
      ...details,
    }));
  }
}
