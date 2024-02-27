import dedent from 'dedent';
import { createLogger, transports, level } from 'winston';
import chalk from 'chalk';
import inputPrompt from '@inquirer/input';
import { config } from 'dotenv';
import { Activity, ActivityKind, Agent, Optimizer } from '@caretaker/agent';
import { OpenAI, ChatOpenAI } from '@langchain/openai';
import { Fireworks } from '@langchain/community/llms/fireworks';
import { Ollama } from '@langchain/community/llms/ollama';

config();

class SimpleOptimizer implements Optimizer {
  constructor(
    readonly wordLimit: number
  ) { }

  async optimize(activities: Activity[]): Promise<Activity[]> {
    let wordCount = activities.map(act => act.input.split(' ').length).reduce((a, b) => a + b, 0);
    let optimizedActs = [...activities];

    while (wordCount > this.wordLimit && optimizedActs.length > 0) {
      const actToRemove = optimizedActs.shift()!;
      wordCount -= actToRemove.input.split(' ').length;
    }

    return optimizedActs;
  }
}

const main = async () => {
  const llm = new OpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 256,
    callbacks: [{
      handleLLMStart: (_, [prompt]) => {
        console.log('prompt', prompt)
      },
      handleLLMEnd: ({ generations }) => {
        console.log('generations', generations)
      }
    }]
  });
  // const llm = new Ollama({
  //   baseUrl: 'http://localhost:11434',
  //   model: 'mistral:instruct',
  //   temperature: 0.7,
  //   callbacks: [{
  //     handleLLMStart: (_, [prompt]) => {
  //       console.log('prompt', prompt)
  //     },
  //     handleLLMEnd: ({ generations }) => {
  //       console.log('generations', generations)
  //     }
  //   }]
  // });

  // const llm = new Fireworks({
  //   // modelName: 'accounts/fireworks/models/mixtral-8x7b-instruct',
  //   modelName: 'accounts/fireworks/models/mistral-7b-instruct-4k', // Does not understand special characters
  //   temperature: 0.9,
  //   callbacks: [{
  //     handleLLMStart: (_, [prompt]) => {
  //       console.log('prompt', prompt)
  //     },
  //     handleLLMEnd: ({ generations }) => {
  //       console.log('generations', generations)
  //     }
  //   }]
  // })

  const agent = new Agent({
    name: 'CalculatorAI',
    description: '',
    llm,
    isChatModel: true,
    // logger: createLogger({
    //   transports: [new transports.Console({ level: 'debug' })]
    // }),
    objective: dedent`
      1. Help the user with math.
      2. Use actions for calculations.
      3. Order of Operations: PEMDAS
      The order of operations, often remembered by the acronym PEMDAS, determines the order in which mathematical operations should be performed in an expression.
      This ensures that all expressions are evaluated consistently and avoid ambiguity.
      4. Notify the user about avery action you take.
      **Always start with friendly introduction**
    `.trim(),
    typeDefs: dedent`
      schema {
        query: Query
        mutation: Mutation
      }

      type Query {
        currentTime: CurrentTimeResult
      }

      type Mutation {
        """
        Relay information to the user and wait for the reply. Note that this is only way of communicating information to the user.
        """
        say(input: SayInput!): SayResult
        add(input: MathInput!): MathResult
        subtract(input: MathInput!): MathResult
        multiply(input: MathInput!): MathResult
        divide(input: MathInput!): MathResult
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
        currentTime: () => ({ iso: new Date().toISOString() })
      },
      Mutation: {
        say: async (_, { input: { message } }) => {
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
      }
    },
    history: [
      new Activity({
        kind: ActivityKind.Observation, input: JSON.stringify({
          data: { say: { reply: 'Hi!, how can you help me?' } }
        }, null, 2)
      })
    ],
    optimizer: new SimpleOptimizer(1000),
  });

  await agent.invoke();
};

main();