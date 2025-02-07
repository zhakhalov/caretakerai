import { Activity, ActivityKind } from '../activities/activity';
import { HistoryTransformer } from './transformer';

/**
 * Transformer that ensures there is at most one thought and one action,
 * arranged in Thought -> Action order
 */
export class OrderedNewActivitiesTransformer implements HistoryTransformer {
  async transform(activities: Activity[]): Promise<Activity[]> {
    // Find the last thought and action
    const lastThought = activities.find(a => a.kind === ActivityKind.Thought);
    const lastAction = activities.find(a => a.kind === ActivityKind.Action);

    const result: Activity[] = [];

    // Add thought first if it exists
    if (lastThought) {
      result.push(lastThought);
    }

    // Add action second if it exists
    if (lastAction) {
      result.push(lastAction);
    }

    return result;
  }
}