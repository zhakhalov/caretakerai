export declare enum ActivityKind {
    Observation = "Observation",
    Thought = "Thought",
    Action = "Action"
}
export type ActivityParams = {
    kind: ActivityKind;
    order: number;
    input: string;
    tokens?: number;
};
export declare class Activity implements ActivityParams {
    kind: ActivityKind;
    order: number;
    input: string;
    tokens?: number;
    static readonly defaults: Partial<ActivityParams>;
    constructor(params: ActivityParams);
    toString(): string;
    toObject(): this;
    static parse(text: string): Activity;
    static fromObject({ kind, order, input }: Record<string, any>): Activity;
}
