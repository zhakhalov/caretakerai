export declare enum ActivityKind {
    Observation = "observation",
    Thought = "thought",
    Action = "action"
}
export type ActivityParams = {
    kind: ActivityKind;
    input: string;
    attributes?: Record<string, string>;
    tokens?: number;
};
export declare class Activity implements ActivityParams {
    kind: ActivityKind;
    attributes?: Record<string, string>;
    input: string;
    static readonly defaults: Partial<ActivityParams>;
    constructor(params: ActivityParams);
    toString(): string;
    toObject(): this;
    static fromObject({ kind, attributes, input }: Record<string, any>): Activity;
}
