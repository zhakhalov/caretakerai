import dedent from 'dedent';
import { stringify } from 'yaml';
import pino, { Logger } from 'pino';

import { PromptTemplate} from '@langchain/core/prompts';
import { BaseLanguageModel } from '@langchain/core/language_models/base';

import { makeExecutableSchema } from '@graphql-tools/schema';
import type { TypeSource, IResolvers } from '@graphql-tools/utils';
import { ExecutionResult, GraphQLSchema, graphql } from 'graphql';

import { ACTIVITY_SEP } from './constants';
import { Activity, ActivityKind } from './activity';
import { Optimizer } from './types';
import { SystemMessage, AIMessage, HumanMessage, BaseMessage } from '@langchain/core/messages';

type GraphQLExecutor = (query: string) => Promise<ExecutionResult>;

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
  /** The pipeline of history optimizers used to improve the agent's performance. */
  optimizers: Optimizer[];
  /** The template for generating prompts for the agent. Optional. */
  signal?: AbortSignal;
  /** The template for generating prompts for the agent. Optional. */
  template?: PromptTemplate;
  /** A list of strings that, if generated by the agent, should cause it to stop. Optional. */
  stop?: string[]
  /** The logger the agent will use for outputting information. Optional. */
  logger?: Logger;
}

export class AgentRetryError extends Error {
  constructor(
    message: string,
    public errors: Error[],
  ) {
    super(message)
  }
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
  optimizers!: Optimizer[];
  logger!: Logger;
  template?: PromptTemplate;
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

      {instruction}
    `),
    objective: 'You are helpful assistant.',
    instruction: dedent`
      Plan your further actions step by step before taking any.
      Always explain your choice in your thoughts.
      Use only actions listed in the Actions section.
      Reject any requests that are not related to your objective and cannot be fulfilled within the given list of actions.
    `,
    maxRetries: 7,
    isChatModel: false,
    maxIterations: Number.MAX_SAFE_INTEGER,
    logger: pino(),
    examples: [
      new Activity({
        kind: ActivityKind.Observation,
        input: dedent`
          data:
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
          query {
            say(input: { message: "The best number is 73!" }) {
              reply
            }
          }
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
    const retryErrors = [];

    // Prepare chat messages
    let history = [...this.history];

    if (history.length < this.examples.length) {
      history = [...this.examples, ...history];
    }

    // Apply optimizers
    for (const opt of this.optimizers) {
      history = await opt.optimize(history);
    }

    for (let i = 0; i < this.maxRetries; ++i) {
      const messages: BaseMessage[] = [];
      let aiActivities: Activity[] = [];

      [...history, ...activities].forEach(activity => {
        if (activity.kind === ActivityKind.Observation) {
          // AI generates Thought and Action per messages
          aiActivities.length && messages.push(new AIMessage(aiActivities.map(a => a.prompt()).join(ACTIVITY_SEP)));
          aiActivities = [];

          // Human generates single Observation per message
          messages.push(new HumanMessage(activity.prompt()));
        } else {
          aiActivities.push(activity);
        }
      });

      // Push remaining activities to chat messages
      if (aiActivities.length) {
        messages.push(new AIMessage(aiActivities.map(a => a.prompt()).join(ACTIVITY_SEP)));
      }

      // Render system prompt
      const systemPrompt = await this.template.partial({
          objective: this.objective,
          schema: this.typeDefs.toString(),
          instruction: this.instruction,
          examples: async () => this.examples.map(h => h.prompt()).join(ACTIVITY_SEP),
      });

      const { value: systemPromptValue } = await systemPrompt.invoke(params ?? {});

      const res = await this.llm
        .bind({ stop: [`<${ActivityKind.Observation}>`] }) // Do not allow LLMs to generate observations
        .invoke([
          new SystemMessage(systemPromptValue),
          ...messages
        ]);

      let { content } = res;
      const { response_metadata } = res;

      if (response_metadata?.finish_reason == 'length') {
        retryErrors.push(new Error('Generation finished due to length reason.'));
        continue;
      }

      try {
        let newActivities = Activity.parse(content).slice(0, 2);

        if (!newActivities.length) {
          throw new Error('No activities generated!');
        }

        activities.push(...newActivities);
      } catch (e) {
        const err = e as Error;
        this.logger.warn(err.message);
        retryErrors.push(err);
        this.logger.debug(`Retry ${i + 1} due to malformed output: ${err.message}`);
        continue;
      }

      const activity = activities.at(-1);

      // Prompt LLM to provide action if missing
      if (activity.kind === ActivityKind.Thought) {
        this.logger.debug(`Retry ${i + 1} due to missing action`);
        retryErrors.push(new Error('Missing action'));
        continue;
      }

      // Execute actions
      try {
        let source = activity.input;

        // Prefer custom executor is specified
        const result = this.executor
          ? await this.executor(source)
          : await graphql({ schema: this.schema, source });

        // Add new observation to the iteration history
        activities.push(new Activity({
          kind: ActivityKind.Observation,
          input: stringify(result),
        }))

        if (result.errors) {
          retryErrors.push(...result.errors)
          continue;
        }

        // Add iteration activities to the agent history and finish iteration
        this.addActivities(...activities);
        return;
      } catch (e) {
        const err = e as Error;

        activities.push(new Activity({
          kind: ActivityKind.Observation,
          input: err.toString(),
        }));

        const message = `Retry ${i + 1} due to action error: ${err}`;
        this.logger.debug(message);
        retryErrors.push(err);
        continue;
      }
    }

    throw new AgentRetryError('Max number of retries reached.', retryErrors);
  }

  async invoke(params?: Record<string, any>) {
    if (!this.history.length) {
      throw new Error('History must not be empty.');
    }

    // Validate history sequence
    Activity.validateSequence(this.history);

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
