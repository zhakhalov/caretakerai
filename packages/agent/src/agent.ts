import dedent from 'dedent';
import { stringify } from 'yaml';
import { Logger, createLogger, transports } from 'winston';

import { BasePromptTemplate, PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { BaseLanguageModel } from '@langchain/core/language_models/base';

import { makeExecutableSchema } from '@graphql-tools/schema';
import type { TypeSource, IResolvers } from '@graphql-tools/utils';
import { GraphQLSchema, graphql } from 'graphql';

import { ACTIVITY_SEP } from './constants';
import { Activity, ActivityKind } from './activity';
import { Optimizer } from './types';

type GraphQLExecutor = (query: string) => Promise<Record<string, unknown>>;

/**
 * Parameters for initializing an Agent.
 */
interface AgentPrams {
  /** The name of the agent. */
  name: string;
  /** A description of the agent. */
  description: string;
  /** The language model the agent will use. */
  llm: BaseLanguageModel;
  /** Is chat model is used. Used to mitigate Langchain Human prefix in case of interacting with chat model. should be removed in favor of LLM selectors once fixed */
  isChatModel?: boolean;
  /** A GraphQL type definitions document. */
  typeDefs: TypeSource;
  /** A GraphQL resolvers. Will be ignored if custom executor is used. Optional. */
  resolvers?: IResolvers;
  /** The custom GraphQL executor to handle agent action. Optional. */
  executor?: GraphQLExecutor
  /** The history of activities performed by the agent. Optional. */
  history?: Activity[];
  /** Examples of activities to guide the agent. Optional. */
  examples?: Activity[];
  /** The objective or goal the agent is trying to achieve. Optional. */
  objective?: string;
  /** Completion instruction for the LLM. Optional. */
  instruction?: string;
  /** The maximum number of iterations the agent can perform. Optional. */
  maxIterations?: number;
  /** The maximum number of retries for actions. Optional. */
  maxRetries?: number;
  /** The optimizer used to improve the agent's performance. */
  optimizer: Optimizer;
  /** The template for generating prompts for the agent. Optional. */
  signal?: AbortSignal;
  /** The template for generating prompts for the agent. Optional. */
  template?: BasePromptTemplate;
  /** A list of strings that, if generated by the agent, should cause it to stop. Optional. */
  stop?: string[]
  /** The logger the agent will use for outputting information. Optional. */
  logger?: Logger;
}

export class Agent implements AgentPrams {
  name!: string;
  description!: string;
  llm!: BaseLanguageModel;
  typeDefs!: TypeSource;
  resolvers: IResolvers;
  history!: Activity[];
  examples: Activity[];
  objective: string;
  instruction: string;
  maxIterations: number;
  maxRetries: number;
  isChatModel: boolean;
  signal: AbortSignal;
  optimizer!: Optimizer;
  logger!: Logger;
  template?: BasePromptTemplate;
  executor?: GraphQLExecutor;

  readonly schema: GraphQLSchema;

  static defaults: Partial<AgentPrams> = {
    template: PromptTemplate.fromTemplate(dedent`
      # Objective
      {objective}

      # GraphQL Schema
      The only permissible actions you may take are listed below:
      \`\`\`graphql
      {schema}
      \`\`\`

      **Continue the History with your thoughts and actions following format in your response:**
      {examples}

      # History:
      {history}
      {instruction}
      {completions}
    `),
    objective: 'You are helpful assistant.',
    instruction: dedent`
      Plan your further actions step by step before taking any.
      Always explain your choice in your thoughts.
      Use only actions listed in the Actions section.
      Do multiple queries or mutations in a single request if possible.
      Reject any requests that are not related to your objective and cannot be fulfilled within the given list of actions.
      Thought and Action goes here.
    `,
    maxRetries: 7,
    isChatModel: false,
    maxIterations: Number.MAX_SAFE_INTEGER,
    logger: createLogger({ transports: [new transports.Console()] }),
    examples: [
      new Activity({
        kind: ActivityKind.Observation,
        input: dedent`
          <!-- The result of the previous action e.g. -->
          data
            theBestNumber:
              result: 73
        `.trim(),
      }),
      new Activity({
        kind: ActivityKind.Thought,
        input: 'Now I know that the best number is 73. I should share this information with the user immediately.',
      }),
      new Activity({
        kind: ActivityKind.Action,
        input: dedent`
          <!-- The action must be a single executable GraphQL request e.g. -->
          \`\`\`graphql
          mutation {
            say(input: { message: "The best number is 73!" }) {
              reply
            }
          }
          \`\`\`
        `.trim(),
      }),
    ],
  }

  constructor(params: AgentPrams) {
    Object.assign(this, Agent.defaults, params);
    const { typeDefs, resolvers, executor } = params;

    // Create schema and validate
    if (!executor) {
      this.schema = makeExecutableSchema({ typeDefs, resolvers });
    }
  }

  addActivities(...activities: Activity[]) {
    activities.forEach(a => this.logger.debug(a));
    this.history.push(...activities)
  }

  async prompt(params?: Record<string, string>) {
    let activities: Activity[] = [];

    const history = async () => {
      const history = await this.optimizer.optimize(this.history);
      const historyStrings = history.map(h => h.prompt()).join(ACTIVITY_SEP);
      return historyStrings;
    };

    const completions = async () => {
      // Guide NonChat LLM to start with the thought
      if (!activities.length && !this.isChatModel) {
        return `<${ActivityKind.Thought}>`;
      }

      const activitiesStrings = activities.map(a => a.prompt()).join(ACTIVITY_SEP);
      return activitiesStrings;
    };

    const instruction = () => this.instruction
      .split('\n')
      .filter(i => i)
      .map(i => `<!-- ${i} -->`)
      .join('\n');

    const examples = async () => {
      const examplesStrings = this.examples.map(h => h.prompt()).join(ACTIVITY_SEP);
      return examplesStrings;
    };

    const template = await this.template.partial({
      objective: this.objective,
      schema: this.typeDefs.toString(),
      history,
      examples,
      instruction,
      completions,
    });

    const chain = template
      .pipe((prompt) => prompt.toString().trim())
      .pipe(this.llm.bind({ stop: [`<${ActivityKind.Observation}>`] })) // Do not allow LLMs to generate observations
      .pipe(new StringOutputParser());

    for (let i = 0; i < this.maxRetries; ++i) {
      let completion = await chain.invoke(params ?? {});

      // Guide NonChat LLM to start with the thought
      if (!completion.startsWith(`${ActivityKind.Thought}`) && !this.isChatModel) {
        completion = `<${ActivityKind.Thought}>\n${completion}`;
      }

      try {
        let newActivities = Activity.parse(completion).slice(0, 2);

        if (!newActivities.length) {
          throw new Error('No activities generated!');
        }

        // Error if multiple thoughts are generated
        if (newActivities.filter(a => a.kind === ActivityKind.Thought).length > 1) {
          throw new Error('Multiple thoughts generated!');
        }

        // Forget the Actions from new activities except first one
        const activityIndex = newActivities.findIndex(a => a.kind === ActivityKind.Action);
        newActivities = newActivities.slice(0, activityIndex + 1)

        activities.push(...newActivities);
      } catch (e) {
        const err = e as Error;
        this.logger.warn(err.message);
        this.logger.debug(`Retry ${i + 1} due to malformed output: ${err.message}`);
        continue;
      }

      const activity = activities.at(-1);

      // Prompt LLM to provide action if missing
      if (activity.kind === ActivityKind.Thought) {
        this.logger.debug(`Retry ${i + 1} due to missing action`);
        continue;
      }

      // Execute actions
      try {
        const source = activity.input
          .trim()
          .replace(/^```\w*/, '') // Remove leading coding tag (```graphql)
          .replace(/```$/, '') // Remove trailing coding tag (```)
          .trim();


        // Prefer custom executor is specified
        const result = this.executor
          ? await this.executor(source)
          : await graphql({ schema: this.schema, source });

        // Add new observation to the history
        this.addActivities(
          ...activities,
          new Activity({
            kind: ActivityKind.Observation,
            input: stringify(result),
          }),
        );

        return;
      } catch(e) {
        const err = e as Error;

        activities.push(new Activity({
          kind: ActivityKind.Observation,
          input: err.toString(),
        }));

        this.addActivities(...activities);
        activities = [];
        this.logger.debug(`Retry ${i + 1} due to action error: ${err}`);
        continue;
      }
    }

    throw new Error('Max number of retries reached.');
  }

  async invoke(params?: Record<string, any>) {
    if (!this.history.length) {
      throw new Error('History must not be empty.');
    }

    if (this.history.at(-1)?.kind !== ActivityKind.Observation) {
      throw new Error('Latest experience must be of Observation kind');
    }

    for (let i = 0; i < this.maxIterations; ++i) {
      await this.prompt(params);
      this.signal?.throwIfAborted();
    }

    throw new Error('Max number of iterations reached.');
  }
}
