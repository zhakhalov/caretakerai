import dedent from 'dedent';
import { createLogger, transports, level } from 'winston';
import { config } from 'dotenv';
import { Activity, ActivityKind, Agent, Optimizer } from '@caretaker/agent';
import { OpenAI } from 'langchain/llms/openai';
import { Say } from './actions/say';
import { Search } from './actions/search';
import { fromDocuments, fromExistingIndex } from './retriever';

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
    modelName: 'gpt-4-1106-preview',
    temperature: 0.7,
    maxTokens: 256,
    callbacks: [{ handleLLMStart: (_, [prompt]) => console.log(prompt) }]
  });

  // const retriever = await fromDocuments();
  const retriever = await fromExistingIndex();

  const agent = new Agent({
    name: 'QnA',
    description: '',
    llm,
    logger: createLogger({
      transports: [new transports.Console({ level: 'debug' })]
    }),
    actions: [
      new Say(),
      new Search(retriever, llm),
    ],
    history: [
      new Activity({ kind: ActivityKind.Observation, input: 'The user says: How can you help me?' })
    ],
    optimizer: new SimpleOptimizer(3000),
    objective: dedent`
      1. Help the user with finding information.
      2. Search no more then 7 times before providing the answer.
      3. Subsequent searches must be different from one another.
      4. Prefer multiple searches to answer complex questions.
    `.trim(),
  });

  await agent.invoke();
};

main();