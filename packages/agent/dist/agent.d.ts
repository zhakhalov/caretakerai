import { BasePromptTemplate } from 'langchain/prompts';
import { Action } from './action';
import { Activity } from './activity';
import { Optimizer } from './types';
import { BaseLLM } from 'langchain/dist/llms/base';
interface AgentPrams {
    name: string;
    description: string;
    llm: BaseLLM;
    actions: Action[];
    activities?: Activity[];
    instruction: string;
    optimizer: Optimizer;
    template?: BasePromptTemplate;
    stop?: string[];
}
export declare class Agent implements AgentPrams {
    name: string;
    description: string;
    llm: BaseLLM;
    actions: Action[];
    activities: Activity[];
    instruction: string;
    optimizer: Optimizer;
    template?: BasePromptTemplate;
    stop?: string[];
    static defaults: Partial<AgentPrams>;
    static parseActivities(text: string): any;
    constructor(params: AgentPrams);
    addActivities(...experience: Activity[]): void;
    complete(params: Record<string, string>): Promise<any>;
    execute({ attributes, input }: Activity): Promise<string>;
    invoke(): Promise<string>;
}
export {};
