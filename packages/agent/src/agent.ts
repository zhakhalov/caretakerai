import dedent from 'dedent';
import { BasePromptTemplate, PromptTemplate } from 'langchain/prompts';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { Action } from './action';
import { ACTION_SEP, ACTIVITY_SEP } from './constants';
import { Activity, ActivityKind } from './activity';
import { Optimizer } from './types';
import { BaseLLM } from 'langchain/dist/llms/base';

interface AgentPrams {
  name: string;
  description: string;
  llm: BaseLLM;
  actions: Action[];
  history?: Activity[];
  examples?: Activity[];
  constrains?: string[];
  objective?: string;
  thoughtSuffix?: string;
  actionSuffix?: string;
  optimizer: Optimizer;
  template?: BasePromptTemplate;
  stop?: string[]
}

export class Agent implements AgentPrams {
  name!: string;
  description!: string;
  llm!: BaseLLM;
  actions!: Action[];
  history!: Activity[];
  examples!: Activity[];
  constrains!: string[];
  objective!: string;
  optimizer!: Optimizer;
  template?: BasePromptTemplate;

  static defaults: Partial<AgentPrams> = {
    template: PromptTemplate.fromTemplate(dedent`
      # Objective
      {objective}

      # Constraints
      {constraints}

      # Actions
      The only permissible actions you may take are listed below:
      {actions}

      **Continue the History with the following format in your response:**
      {examples}

      # History:
      {history}
      {suffix}
    `.trim()),
    objective: 'You are helpful assistant.',
    examples: [
      new Activity({
        kind: ActivityKind.Observation,
        input: 'The result of previously taken action',
      }),
      new Activity({
        kind: ActivityKind.Thought,
        input: 'You must always think before taking the action',
      }),
      new Activity({
        kind: ActivityKind.Action,
        attributes: { kind: 'the action kind to take, should be one of listed in Actions section' },
        input: dedent`
          <!-- The action input as valid JSON e.g. -->
          {
            "message": "hello!!"
          }
        `.trim(),
      }),
    ],
    constrains: [
      'You are strongly prohibited from taking any actions other than those listed in Actions.',
      'Reject any request that are not related to your objective and cannot be fulfilled within the given list of actions.',
    ]
  }

  constructor(params: AgentPrams) {
    const { actions } = params;

    if (!actions.length) {
      throw new Error('Actions list must be non empty');
    }

    Object.assign(this, Agent.defaults, params);
  }

  addActivities(...experience: Activity[]) {
    experience.forEach(e => console.log(e));

    this.history.push(...experience)
  }

  async prompt(params?: Record<string, string>) {
    const actions = async () => {
      const actionsStrings = await Promise.all(this.actions.map(a => a._prompt()));
      return actionsStrings.join(ACTION_SEP);
    };

    const constraints = () => this.constrains.map((c, i) => `${i + 1}. ${c}`).join('\n');

    const history = async () => {
      const history = await this.optimizer.optimize(this.history);
      const historyStrings = history.map(h => h.prompt()).join(ACTIVITY_SEP);
      return historyStrings;
    };

    const examples = async () => {
      const examplesStrings = this.examples.map(h => h.prompt()).join(ACTIVITY_SEP);
      return examplesStrings;
    };

    const template = await this.template.partial({
      objective: this.objective,
      actions,
      constraints,
      history,
      examples,
    })

    // TODO: add retries and validations

    const completion = await RunnableSequence.from([
      template,
      this.llm.bind({ stop: [`<${ActivityKind.Observation}>`] }), // Do not allow LLMs to generate observations
      new StringOutputParser(),
    ]).invoke(params ?? {}, {
      callbacks: [
        {
          handleLLMStart: (llm, prompts) => {
            // console.log(prompts);
          }
        }
      ]
    });

    return Activity.parse(completion.trim());
  }

  async execute({ attributes, input }: Activity) {
    const { kind } = attributes;
    const action = this.actions.find(a => a.kind === kind);

    if (!action) {
      throw new Error(`Action "${kind}" is not permitted.`);
    }

    const observation = await action._call(input, this);

    this.addActivities(new Activity({
      kind: ActivityKind.Observation,
      input: observation,
    }));

    if (action.exit) {
      return observation;
    }
  }

  async invoke(input = {}) {
    if (!this.history.length) {
      throw new Error('Activity list must not be empty.');
    }

    if (this.history.at(-1)?.kind !== ActivityKind.Observation) {
      throw new Error('Latest experience must be of Observation kind');
    }

    while (true) {
      const activity = this.history.at(-1)!;

      if (activity.kind === ActivityKind.Observation) {
        this.addActivities(...(await this.prompt({ suffix: '<!-- Provide thought and action here -->', ...input })));
      } else if (activity.kind === ActivityKind.Thought) {
        this.addActivities(...(await this.prompt({ suffix: '<!-- Provide action here -->', ...input })));
      } else if (activity.kind === ActivityKind.Action) {
        const result = await this.execute(activity);

        if (result) {
          return result;
        }
      } else {
        // TODO: retry
        throw new Error(`Activity "${activity.kind}" is not permitted.`);
      }
    }
  }
}
