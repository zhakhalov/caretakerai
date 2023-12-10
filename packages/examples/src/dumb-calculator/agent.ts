import dedent from 'dedent';
import dontenv from 'dotenv';
import { Activity, ActivityKind, Agent, Optimizer } from '@caretaker/agent';
import { OpenAI } from 'langchain/llms/openai';
import { Say } from './actions/say';
import { Sum } from './actions/sum';
import { Multiply } from './actions/multiply';

dontenv.config();

class SimpleOptimizer implements Optimizer {
  constructor (
    readonly wordLimit: number
  ) {}

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
    maxTokens: 1000,
  });
  
  const agent = new Agent({
    name: 'CalculatorAI',
    description: '',
    llm,
    actions: [
      new Say(),
      new Sum(),
      new Multiply(),
    ],
    activities: [
      new Activity({ kind: ActivityKind.Observation, input: 'The user says: How can you help me?' })
    ],
    optimizer: new SimpleOptimizer(1000),
    instruction: dedent`
      ## Objective
      Help the user with arithmetic calculations and answer the results using Say action
  `.trim(),
  });

  await agent.invoke();
};

main();