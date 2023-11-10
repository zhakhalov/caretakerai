import { BaseLanguageModel } from 'langchain/base_language';
import { BasePromptTemplate, PromptTemplate } from 'langchain/prompts';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { Action } from './action';
import { TEMPLATE, ACTIVITY_SEP, ACTION_SEP } from './constants';
import { Activity, ActivityKind } from './activity';
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
  stop?: string[]
}

export class Agent implements AgentPrams {
  name!: string;
  description!: string;
  llm!: BaseLanguageModel;
  actions!: Action[];
  activities!: Activity[];
  example!: Activity[];
  instruction!: string;
  optimizer!: Optimizer;
  template?: BasePromptTemplate;
  stop?: string[]

  static defaults: Partial<AgentPrams> = {
    template: PromptTemplate.fromTemplate(TEMPLATE),
    stop: [`//${ActivityKind.Observation}`],
    activities: [],
    example: []
  }

  static parseActivities(input: string) {
    return input
      .split('\n//')
      .filter(text => text)
      .map(text => `//${text.replace(/^\/\//, '').trim()}`) // Fix leading slashes
      .map(text => Activity.parse(text.trim()));
  }

  constructor(params: AgentPrams) {
    const { actions } = params;

    if (!actions.length) {
      throw new Error('Actions list must be non empty');
    }

    Object.assign(this, Agent.defaults, params);
  }

  appendActivity(...experience: Activity[]) {
    experience.forEach(e => console.log(e.toString()));

    this.activities.push(...experience)
  }

  async complete(experienceTemplate: Activity) {
    const activities = await this.optimizer.optimize(this.activities);
    const completion = await RunnableSequence.from([
      this.template!,
      this.llm.bind({ stop: this.stop }), // Do not allow LLMs to generate observations
      new StringOutputParser(),
    ]).invoke({
      instruction: this.instruction,
      actions: this.actions.map((a, index) => `${index + 1}. ${a.toString()}`).join(ACTION_SEP),
      example: this.example.map(e => e.toString()).join(`\n`),
      activities: [...activities, experienceTemplate].map(e => e.toString()).join(`\n`),
    }, {
      callbacks: [
        {
          handleLLMStart: (llm, prompts) => {
            // console.log(prompts);
          }
        }
      ]
    })

    return Agent.parseActivities(experienceTemplate.toString() + completion.trim());
  }

  async think(latestActivity: Activity) {
    // TODO: add retries - retry completion if LLM generate incorrect output (wrong format, wrong action etc.)

    this.appendActivity(...(await this.complete(new Activity({
      kind: ActivityKind.Thought,
      order: latestActivity.order,
      input: '',
    }))));
  }

  async act(latestActivity: Activity) {
    // TODO: add retries - retry completion if LLM generate incorrect output (wrong format, wrong action etc.)

    this.appendActivity(...(await this.complete(new Activity({
      kind: ActivityKind.Action,
      order: latestActivity.order,
      input: '',
    }))));
  }

  async execute(latestActivity: Activity) {
    const { kind, input } = Action.parse(latestActivity.input);
    const action = this.actions.find(a => a.kind === kind);

    if (!action) {
      throw new Error(`Action "${kind}" is not permitted.`);
    }

    const observation = await action.execute({ agent: this, input })

    this.appendActivity(new Activity({
      kind: ActivityKind.Observation,
      order: latestActivity.order + 1,
      input: observation,
    }));

    if (action.exit) {
      return observation;
    }
  }

  async invoke() {
    if (!this.activities.length) {
      throw new Error('Activity list must not be empty.');
    }

    if (this.activities.at(-1)?.kind !== ActivityKind.Observation) {
      throw new Error('Lastest experience must be of Observation kind');
    }

    while (true) {
      const latestActivity = this.activities.at(-1)!;

      if (latestActivity.kind === ActivityKind.Observation) {
        await this.think(latestActivity);
      } else if (latestActivity.kind === ActivityKind.Thought) {
        await this.act(latestActivity);
      } else if (latestActivity.kind === ActivityKind.Action) {
        const result = await this.execute(latestActivity);

        if (result) {
          return result;
        }
      } else {
        throw new Error(`Activity "${latestActivity.kind}" is not permitted.`);
      }
    }
  }
}
