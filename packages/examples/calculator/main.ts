import dedent from 'dedent';
import { createLogger, transports, level } from 'winston';
import { config } from 'dotenv';
import { Activity, ActivityKind, Agent, Optimizer } from '@caretaker/agent';
import { OpenAI, ChatOpenAI } from '@langchain/openai';
import { Fireworks } from '@langchain/community/llms/fireworks';
import { Ollama } from '@langchain/community/llms/ollama';
import { Say } from './actions/say';
import { Add } from './actions/add';
import { Multiply } from './actions/multiply';
import { Subtract } from './actions/subtract';
import { Divide } from './actions/divide';

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
  // const llm = new OpenAI({
  //   modelName: 'gpt-3.5-turbo',
  //   temperature: 0.7,
  //   maxTokens: 256,
  //   callbacks: [{
  //     handleLLMStart: (_, [prompt]) => {
  //       console.log('prompt', prompt)
  //     },
  //     handleLLMEnd: ({ generations }) => {
  //       console.log('generations', generations)
  //     }
  //   }]
  // });
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

  const llm = new Fireworks({
    // modelName: 'accounts/fireworks/models/mixtral-8x7b-instruct',
    modelName: 'accounts/fireworks/models/mistral-7b-instruct-4k', // Does not understand special characters
    temperature: 0.9,
    callbacks: [{
      handleLLMStart: (_, [prompt]) => {
        console.log('prompt', prompt)
      },
      handleLLMEnd: ({ generations }) => {
        console.log('generations', generations)
      }
    }]
  })

  const agent = new Agent({
    name: 'CalculatorAI',
    description: '',
    llm,
    isChatModel: false,
    logger: createLogger({
      transports: [new transports.Console({ level: 'debug' })]
    }),
    actions: [
      new Say(),
      new Add(),
      new Multiply(),
      new Subtract(),
      new Divide(),
    ],
    history: [
      new Activity({ kind: ActivityKind.Observation, input: 'The user says: How can you help me?' })
    ],
    optimizer: new SimpleOptimizer(1000),
    objective: dedent`
      1. Help the user with math.
      2. Use actions for calculations.
      3. Order of Operations: PEMDAS
      The order of operations, often remembered by the acronym PEMDAS, determines the order in which mathematical operations should be performed in an expression.
      This ensures that all expressions are evaluated consistently and avoid ambiguity.
      4. Think your plan of actions in advance.
    `.trim(),
  });

  await agent.invoke();
};

main();