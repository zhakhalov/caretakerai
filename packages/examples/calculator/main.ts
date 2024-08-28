import dedent from 'dedent';
import chalk from 'chalk';
import yaml from 'yaml';
import inputPrompt from '@inquirer/input';
import { config } from 'dotenv';
import { Activity, ActivityKind, Agent, AgentRetryError } from '@caretakerai/agent';
import { LengthOptimizer, RemoveErrorActivitiesOptimizer } from '@caretakerai/optimizer';
import { ChatGroq } from '@langchain/groq';
import { assert } from 'console';

config();

const main = async () => {
  const llm = new ChatGroq({
    callbacks: [{
      handleLLMStart: (_, prompt) => {
        console.log('prompt', prompt)
      },
      handleLLMEnd: (info) => {
        console.log('generations', info)
      }
    }]
  })

  const controller = new AbortController();

  const agent = new Agent({
    name: 'CalculatorAI',
    description: '',
    llm,
    isChatModel: true,
    // logger: console as unknown as ,
    objective: dedent`
      1. Help the user with math.
      2. Use actions for calculations.
      3. Order of Operations: PEMDAS
      The order of operations, often remembered by the acronym PEMDAS, determines the order in which mathematical operations should be performed in an expression.
      This ensures that all expressions are evaluated consistently and avoid ambiguity.
      4. Notify the user about avery action you take.
      5. Finish the exercise once user say "Thank you!" with the latest result. no other actions is possible finishing the exercise
      **Always start with friendly introduction**
    `.trim(),
    maxRetries: 3,
    typeDefs: dedent /* GraphQL */ `
      schema {
        query: Query
      }

      type Query {
        currentTime: CurrentTimeResult
        """
        Relay information to the user and wait for the reply. Note that this is only way of communicating information to the user.

        """
        say(input: SayInput!): SayResult
        add(input: MathInput!): MathResult
        subtract(input: MathInput!): MathResult
        multiply(input: MathInput!): MathResult
        divide(input: MathInput!): MathResult
        finish(input: FinishInput!): Float
      }

      # Inputs for mathematical operations
      input MathInput {
        left: Float!
        right: Float!
      }

      # Inputs for say operation
      input SayInput {
        message: String! # The message to say to the user
      }

      # Inputs for finish operation
      input FinishInput {
        result: Float!
      }

      # Current system time
      type CurrentTimeResult {
        iso: String! # Current data time in ISO format
      }

      # Result for say results
      type SayResult {
        reply: String # The user's reply
        error: String # can be used to describe any error that occurred during the computation
      }

      # Result for mathematical operations
      type MathResult {
        result: Float
        error: String # can be used to describe any error that occurred during the computation
      }
    `.trim(),
    resolvers: {
      Query: {
        currentTime: () => ({ iso: new Date().toISOString() }),
        say: async (_, { input: { message } }, context, info) => {
          console.log(`${chalk.bold(`${agent.name}:`)} ${message}`);

          const reply = await inputPrompt({
            message: 'Human:'
          });

          return { reply };
        },
        add: (_, { input: { left, right } }) => {
          try {
            return { result: left + right };
          } catch (error) {
            return { error };
          }
        },
        subtract: (_, { input: { left, right } }) => {
          try {
            return { result: left - right };
          } catch (error) {
            return { error };
          }
        },
        multiply: (_, { input: { left, right } }) => {
          try {
            return { result: left * right };
          } catch (error) {
            return { error };
          }
        },
        divide: (_, { input: { left, right } }) => {
          try {
            return { result: left / right };
          } catch (error) {
            return { error };
          }
        },
        finish(_, { input }) {
          controller.abort();
          return input.result;
        }
      }
    },
    history: [
      new Activity({
        kind: ActivityKind.Observation, input: yaml.stringify({
          data: { say: { reply: 'Hi!, how can you help me?' } }
        }, null, 2)
      })
    ],
    optimizers: [new RemoveErrorActivitiesOptimizer(), new LengthOptimizer(16)],
  });

  try {
    const result = await agent.invoke();

    console.log(result);
  } catch (err) {
    assert(err instanceof AgentRetryError)
    console.error(err);
  }
};

main();