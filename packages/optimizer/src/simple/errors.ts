import { parse } from 'yaml';
import { Activity, ActivityKind, Optimizer } from '@caretakerai/agent';

export class RemoveErrorActivitiesOptimizer implements Optimizer {
  async optimize(activities: Activity[]): Promise<Activity[]> {
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

