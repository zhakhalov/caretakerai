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
  maxIterations?: number;
  maxRetries?: number;
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
  thoughtSuffix!: string;
  actionSuffix!: string;
  maxIterations!: number;
  maxRetries!: number;
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
    thoughtSuffix: '<!-- Provide thought and action here -->',
    actionSuffix: '<!-- Provide action here -->',
    maxRetries: 7,
    maxIterations: Number.MAX_SAFE_INTEGER,
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
      'Use only actions listed in Actions section.',
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
    let activities: Activity[] = [];

    const history = async () => {
      const history = [...await this.optimizer.optimize([...this.history, ...activities])];
      const historyStrings = history.map(h => h.prompt()).join(ACTIVITY_SEP);
      return historyStrings;
    };

    const actions = async () => {
      const actionsStrings = await Promise.all(this.actions.map(a => a._prompt()));
      return actionsStrings.join(ACTION_SEP);
    };

    const constraints = () => this.constrains.map((c, i) => `${i + 1}. ${c}`).join('\n');

    const examples = async () => {
      const examplesStrings = this.examples.map(h => h.prompt()).join(ACTIVITY_SEP);
      return examplesStrings;
    };

    const suffix = () => ([...this.history, ...activities].at(-1).kind === ActivityKind.Observation
      ? this.thoughtSuffix
      : this.actionSuffix
    );

    const template = await this.template.partial({
      objective: this.objective,
      history,
      actions,
      constraints,
      examples,
      suffix,
    });

    const seq = RunnableSequence.from([
      template,
      this.llm.bind({ stop: [`<${ActivityKind.Observation}>`] }), // Do not allow LLMs to generate observations
      new StringOutputParser(),
    ]);

    for (let i = 0; i < this.maxRetries; ++i) {
      let completion = await seq.invoke(params ?? {});

      try {
        activities = [...activities, ...Activity.parse(completion)];
      } catch (e) {
        console.log(e)
        continue; // retry due to malformed output
      }

      const activity = activities.at(-1)

      if (activity.kind === ActivityKind.Thought) {
        continue; // retry for action
      }

      if (activity.kind === ActivityKind.Action) {
        try {
          const observation = await this.execute(activity);
          // TODO: clean-up retries so that iteration consist first thought and last action and observation
          return [...activities, new Activity({ kind: ActivityKind.Observation, input: observation })];
        } catch(e) {
          activities.push(new Activity({ kind: ActivityKind.Observation, input: e }))
          continue; // retry with error;
        }
      }
    }

    throw new Error('Max number of retries reached.');
  }

  async execute({ attributes, input }: Activity) {
    const { kind } = attributes;
    const action = this.actions.find(a => a.kind === kind);

    if (!action) {
      throw new Error(`Action "${kind}" is not allowed.`);
    }

    const observation = await action._call(input, this);
    return observation;
  }

  async invoke(params?: Record<string, any>) {
    if (!this.history.length) {
      throw new Error('Activity list must not be empty.');
    }

    if (this.history.at(-1)?.kind !== ActivityKind.Observation) {
      throw new Error('Latest experience must be of Observation kind');
    }

    for (let i = 0; i < this.maxIterations; ++i) {
      const activities = await this.prompt(params);
      this.addActivities(...activities);
      const activity = this.history.at(-2)!;
      const action = this.actions.find(a => a.kind === activity.attributes.kind);

      if (action.exit) {
        return this.history.at(-1).input; // latest observation is the result of the latest action
      }
    }

    throw new Error('Max number of iterations reached.');
  }
}
