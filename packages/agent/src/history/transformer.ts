import type { Activity } from '../activities/activity';

export interface HistoryTransformer {
  transform(activities: Activity[]): Promise<Activity[]>;
}
