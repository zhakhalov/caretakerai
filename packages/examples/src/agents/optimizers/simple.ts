import { Activity, Optimizer } from '@caretaker/agent';

export class SimpleOptimizer implements Optimizer {
  constructor (
    readonly wordLimit: number
  ) {}

  async optimize(activities: Activity[]): Promise<Activity[]> {
    let wordCount = activities.map(act => act.input.split(' ').length).reduce((a, b) => a + b, 0);
    let optimizedActs = [...activities];

    while (wordCount > this.wordLimit && optimizedActs.length > 0) {
      const actToRemove = optimizedActs.shift()!;
      wordCount -= actToRemove.input.split(' ').length;
    }

    return optimizedActs;
  }
}
