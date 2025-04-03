import { Activity, HistoryTransformer } from '@caretakerai/agent';

/**
 * A simple history transformer that limits the number of activities in the agent context.
 */
export class LengthTransformer implements HistoryTransformer {
  /**
   * @param limit The maximum number of activities to include in the agent context.
   */
  constructor(
    private readonly limit: number
  ) {}

  async transform(activities: Activity[]) {
    return activities.slice(-this.limit);
  }
}
