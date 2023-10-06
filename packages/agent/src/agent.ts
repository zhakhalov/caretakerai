import { BaseLanguageModel } from 'langchain/base_language';
import { BasePromptTemplate, PromptTemplate } from 'langchain/prompts';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { Action } from './action';
import { TEMPLATE, EXPERIENCE_SEP, ACTION_SEP } from './constants';
import { Experience, ExperienceKind } from './experience';
import { TokenCounter } from './types';

interface AgentPrams {
  llm: BaseLanguageModel;
  actions: Action[];
  experience: Experience[];
  example: Experience[];
  instruction: string;
  template?: BasePromptTemplate;
  capExperienceAfterTokens?: number;
  tokenCounter?: TokenCounter;
}

export class Agent implements AgentPrams {
  llm!: BaseLanguageModel;
  actions!: Action[];
  experience!: Experience[];
  example!: Experience[];
  instruction!: string;
  template?: BasePromptTemplate;
  capExperienceAfterTokens?: number;
  tokenCounter?: TokenCounter;

  constructor(params: AgentPrams) {
    const { actions, experience } = params;

    if (!actions.length) {
      throw new Error('Actions list must be non empty');
    }

    if (!experience.length) {
      throw new Error('Experience list must not be empty.');
    }

    if (experience.at(-1)?.kind !== ExperienceKind.Observation) {
      throw new Error('Lastest experience must be of Observation kind');
    }

    const defaults = {
      template: PromptTemplate.fromTemplate(TEMPLATE),
    }

    Object.assign(this, defaults, params);
  }

  parseExperience(input: string) {
    return Promise.all(input
      .split(EXPERIENCE_SEP)
      .map(text => Experience.parse(text, this.tokenCounter))
    );
  }

  async complete(experienceTemplate: Experience) {
    const { kind, order } = experienceTemplate;

    const completion = await RunnableSequence.from([
      this.template!,
      // TODO: make somre more nifty
      this.llm.bind({ stop: [`.:${ExperienceKind.Observation}:.`] }), // Do not allow LLMs to generate observataions
      new StringOutputParser(),
    ]).invoke({
      instruction: this.instruction,
      actions: this.actions.map(a => a.toString()).join(ACTION_SEP),
      example: this.experience.map(e => e.toString()).join(EXPERIENCE_SEP),
      experience: [...this.experience, experienceTemplate].map(e => e.toString()).join(EXPERIENCE_SEP),
    })

    const text = `${kind} ${order}: ${completion}`;
    return this.parseExperience(text);
  }

  async think(latestExperience: Experience) {
   this.experience.push(...(await this.complete(new Experience({
      kind: ExperienceKind.Thought,
      order: latestExperience.order + 1,
      input: '',
    })))); 
  }

  async act(latestExperience: Experience) {
    this.experience.push(...(await this.complete(new Experience({
      kind: ExperienceKind.Action,
      order: latestExperience.order + 1,
      input: '',
    }))));
  }

  async execute(latestExperience: Experience) {
    const { kind, input } = Action.parse(latestExperience.input);
    const action = this.actions.find(a => a.kind === kind);

    if (!action) {
      throw new Error(`Action "${kind}" is not permitted.`);
    }

    const observation = await action.execute({ agent: this, input })

    this.experience.push(new Experience({
      kind: ExperienceKind.Observation,
      order: latestExperience.order + 1,
      input: observation,
    }));

    if (action.exit) {
      return observation;
    }
  }

  async invoke() {
    while (true) {
      const latestExperience = this.experience.at(-1)!;

      if (latestExperience.kind === ExperienceKind.Observation) {
        await this.think(latestExperience);
      } else if (latestExperience.kind === ExperienceKind.Thought) {
        await this.act(latestExperience);
      } else if (latestExperience.kind === ExperienceKind.Action) {
        const result = await this.execute(latestExperience);

        if (result) {
          return result;
        }
      } else {
        throw new Error(`Experience "${latestExperience.kind}" is not permitted.`);
      }
    }
  }
}
