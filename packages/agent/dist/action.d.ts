import type { Agent } from './agent';
import type { Activity } from './activity';
export interface ActionInput {
    input: string;
    agent: Agent;
}
export interface ActionExample {
    description?: string;
    activities: Activity[];
}
export declare abstract class Action {
    abstract get exit(): boolean;
    abstract get kind(): string;
    abstract get description(): string;
    abstract get examples(): ActionExample[];
    abstract execute(input: ActionInput): Promise<string>;
    toString(): string;
    static parse(text: string): {
        kind: string;
        input: string;
    };
}
