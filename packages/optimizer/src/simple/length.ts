import { Activity, Optimizer } from '@caretakerai/agent';

/**
 * A simple optimizer that limits the number of activities in the agent context.
 */
export class LengthOptimizer implements Optimizer {
  /**
   * @param limit The maximum number of activities to include in the agent context.
   */
  constructor(
    private readonly limit: number
  ) {}

  async optimize(activities: Activity[]) {
    return activities.slice(-this.limit);
  }
}
