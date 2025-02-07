import { parse } from 'yaml';
import { Activity, ActivityKind, HistoryTransformer } from '@caretakerai/agent';

export class RemoveErrorActivitiesTransformer implements HistoryTransformer {
  async transform(activities: Activity[]): Promise<Activity[]> {
    const optimizedActivities = [...activities];

    while (true) {
      const errorObsIdx = optimizedActivities.findIndex(
        ({ input, kind }) => (
          kind === ActivityKind.Observation &&
          parse(input)?.errors)
        );

      if (errorObsIdx === -1) {
        // No more errors
        return optimizedActivities;
      } else if (errorObsIdx === 0) {
        // start with error
        optimizedActivities.splice(errorObsIdx, 2);
      } else {
        // error activity in the middle or end of the history
        optimizedActivities.splice(errorObsIdx - 1, 3);
      }
    }
  }
}

