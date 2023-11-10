import type { Activity } from './activity';
export interface Optimizer {
    optimize(activities: Activity[]): Promise<Activity[]>;
}
