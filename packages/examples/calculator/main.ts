import dedent from 'dedent';
import { createLogger, transports, level } from 'winston';
import { config } from 'dotenv';
import { Activity, ActivityKind, Agent, Optimizer } from '@caretaker/agent';
import { OpenAI } from 'langchain/llms/openai';
import { Say } from './actions/say';
import { Sum } from './actions/sum';
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
  const llm = new OpenAI({
    modelName: 'gpt-3.5-turbo',
    temperature: 0.7,
    maxTokens: 256,
  });

  const agent = new Agent({
    name: 'CalculatorAI',
    description: '',
    llm,
    logger: createLogger({
      transports: [new transports.Console({ level: 'debug' })]
    }),
    actions: [
      new Say(),
      new Sum(),
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
    `.trim(),
  });

  await agent.invoke();
};

main();