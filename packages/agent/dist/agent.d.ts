import { BaseLanguageModel } from 'langchain/base_language';
import { BasePromptTemplate } from 'langchain/prompts';
import { Action } from './action';
import { Activity } from './activity';
import { Optimizer } from './types';
interface AgentPrams {
    name: string;
    description: string;
    llm: BaseLanguageModel;
    actions: Action[];
    activities?: Activity[];
    example?: Activity[];
    instruction: string;
    optimizer: Optimizer;
    template?: BasePromptTemplate;
    stop?: string[];
}
export declare class Agent implements AgentPrams {
    name: string;
    description: string;
    llm: BaseLanguageModel;
    actions: Action[];
    activities: Activity[];
    example: Activity[];
    instruction: string;
    optimizer: Optimizer;
    template?: BasePromptTemplate;
    stop?: string[];
    static defaults: Partial<AgentPrams>;
    static parseActivities(input: string): Activity[];
    constructor(params: AgentPrams);
    appendActivity(...experience: Activity[]): void;
    complete(experienceTemplate: Activity): Promise<Activity[]>;
    think(latestActivity: Activity): Promise<void>;
    act(latestActivity: Activity): Promise<void>;
    execute(latestActivity: Activity): Promise<string>;
    invoke(): Promise<string>;
}
export {};
