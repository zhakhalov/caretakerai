import { Activity, ActivityKind } from '../activities/activity';
import { HistoryTransformer } from './transformer';

/**
 * Transformer that validates the sequence of activities follows the pattern:
 * Observation -> Thought -> Action -> Observation -> ...
 */
export class ValidateSequenceTransformer implements HistoryTransformer {
  async transform(activities: Activity[]): Promise<Activity[]> {
    // Skip validation if there are less than 2 activities
    if (activities.length < 2) {
      return activities;
    }

    ValidateSequenceTransformer.validateSequence(activities);
    return activities;
  }

  private static validateSequence(activities: Activity[]) {
    activities.slice(0, -1).forEach((activity, index) => {
      const next = activities[index + 1];

      if (activity.kind === ActivityKind.Observation && next.kind !== ActivityKind.Thought) {
        throw new Error(`Observation at index ${index} must be followed by Thought`);
      }

      if (activity.kind === ActivityKind.Thought && next.kind !== ActivityKind.Action) {
        throw new Error(`Thought at index ${index} must be followed by Action`);
      }

      if (activity.kind === ActivityKind.Action && next.kind !== ActivityKind.Observation) {
        throw new Error(`Action at index ${index} must be followed by Observation`);
      }
    });
  }
}

/**
 * Transformer that validates that Actions are always followed by Observations.
 * Applicable for OpenAI O series models that prevents generating thoughts
 */
export class OpenAIOValidateSequenceTransformer implements HistoryTransformer {
  async transform(activities: Activity[]): Promise<Activity[]> {
    // Skip validation if there are less than 2 activities
    if (activities.length < 2) {
      return activities;
    }

    activities.slice(0, -1).forEach((activity, index) => {
      const next = activities[index + 1];

      if (activity.kind === ActivityKind.Action && next.kind !== ActivityKind.Observation) {
        throw new Error(`Action at index ${index} must be followed by Observation`);
      }
    });

    return activities;
  }
}