import dedent from 'dedent';
import { BasePromptTemplate, PromptTemplate } from 'langchain/prompts';
import { RunnableSequence } from 'langchain/schema/runnable';
import { StringOutputParser } from 'langchain/schema/output_parser';
import { Action } from './action';
import { ACTION_SEP, ACTIVITY_SEP } from './constants';
import { Activity, ActivityKind } from './activity';
import { Optimizer } from './types';
import { BaseLLM } from 'langchain/dist/llms/base';

export const TEMPLATE = `
# Objective
{objective}

# Actions
The permissible actions I may take are listed below:
{actions}


# Instructions
Continue the History with a thought followed by an action and wait for new observation.
**Example**
{example}

# Constraints
{constraints}

# History:
{history}
{footer}
`.trim();


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
  stop?: string[]

  static defaults: Partial<AgentPrams> = {
    template: PromptTemplate.fromTemplate(TEMPLATE),
    stop: [`<${ActivityKind.Observation}>`],
    objective: 'You are helpful assistant.',
    examples: [
      new Activity({
        kind: ActivityKind.Observation,
        input: 'The result of previous action',
      }),
      new Activity({
        kind: ActivityKind.Thought,
        input: '<!-- Your thoughts here... -->',
      }),
      new Activity({
        kind: ActivityKind.Action,
        attributes: { kind: '<one of listed in Actions section>' },
        input: dedent`
          <!-- The action params in JSON format. e.g -->
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
    experience.forEach(e => console.log(e.toString()));

    this.history.push(...experience)
  }

  async prompt(params?: Record<string, string>) {
    const activities = await this.optimizer.optimize(this.history);

    const actions = async () => {
      const actionsStrings = await Promise.all(this.actions.map(a => a.prompt()));
      return actionsStrings.join(ACTION_SEP);
    };

    const constraints = () => this.constrains.map((c, i) => `${i + 1}. ${c}`).join('\n');

    const history = async () => {
      const historyStrings = this.history.map(h => h.prompt()).join(ACTIVITY_SEP);
      return historyStrings;
    };


    const template = await this.template.partial({
      objective: this.objective,
      actions,
      constraints,
      history
    })

    // TODO: add retries and validations

    const completion = await RunnableSequence.from([
      template,
      this.llm.bind({ stop: this.stop }), // Do not allow LLMs to generate observations
      new StringOutputParser(),
    ]).invoke(params ?? {}, {
      callbacks: [
        {
          handleLLMStart: (llm, prompts) => {
            console.log(prompts);
          }
        }
      ]
    })

    return Activity.parse(completion.trim());
  }

  async execute({ attributes, input }: Activity) {
    const { kind } = attributes;
    const action = this.actions.find(a => a.kind === kind);

    if (!action) {
      throw new Error(`Action "${kind}" is not permitted.`);
    }

    const observation = await action.execute({ agent: this, input })

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
        this.addActivities(...(await this.prompt({ footer: '<!-- Provide thought and action here -->', ...input })));
      } else if (activity.kind === ActivityKind.Thought) {
        this.addActivities(...(await this.prompt({ footer: '<!-- Provide action here -->', ...input })));
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
