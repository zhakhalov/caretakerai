import dedent from 'dedent';
import pino from 'pino';
import { config } from 'dotenv';
import { Activity, ActivityKind, Agent, Optimizer } from '@caretaker/agent';
import { ChatOpenAI } from '@langchain/openai';
import chalk from 'chalk';
import inputPrompt from '@inquirer/input';
import { RetrievalQAChain } from 'langchain/chains';
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
  const llm = new ChatOpenAI({
    modelName: 'gpt-3.5-turbo-16k',
    temperature: 0.7,
    maxTokens: 2000,
    callbacks: [{ handleLLMStart: (_, [prompt]) => {
      console.log(prompt)
    } }]
  });

  // const retriever = await fromDocuments();
  const retriever = await fromExistingIndex();

  const agent = new Agent({
    name: 'QnA',
    description: '',
    isChatModel: true,
    llm,
    logger: pino({ level: 'debug' }),
    objective: dedent`
      1. Help the user with finding information.
      2. Search no more then 7 times before providing the answer.
      3. Subsequent searches must be different from one another.
      4. Prefer multiple searches to answer complex questions.
      5. Prefer user language in making search queries and providing answers.
      6. Prefer answers up to 300 words long.
      7. Prefer descriptive answers split to paragraphs instead of lists.
    `.trim(),
    typeDefs: dedent /* GraphQL */`
      schema {
        query: Query
        mutation: Mutation
      }

      type Query {
        """
        Perform text-searches in the knowledge base and return the results as strings.

        The following example shows the method of searching for information on complex topics:
        <Observation>
        data:
          say:
            reply: 'What is the difference between a white hole and a black hole?'
        <Observation>
        <Thought>
        The user is looking for distinctive features of separate entities of the universe. I should split my search into 2.
        </Thought>
        <Action>
        \`\`\`graphql
        query {
          blackHole: search(input: { query: "What is the nature of a black hole?" }) { result }
          whiteHole: search(input: { query: "What is the nature of a white hole?" }) { result }
        }
        \`\`\`
        </Action>
        <Observation>
        data:
          blackHole:
            result: 'The nature of a black hole is...'
          whiteHole:
            result: 'The nature of a white hole is...'
        <Observation>
        """
        search(input: SearchInput!): SearchResult
      }

      type Mutation {
        """
        Relay information to the user and wait for the reply. Note that this is only way of communicating information to the user.
        """
        say(input: SayInput!): SayResult
      }

      # Inputs for mathematical operations
      input SearchInput {
        query: String!
      }

      # Inputs for say operation
      input SayInput {
        message: String! # The message to say to the user
      }

      # Result for say results
      type SayResult {
        reply: String # The user's reply
        error: String # can be used to describe any error that occurred during the computation
      }

      # Result for mathematical operations
      type SearchResult {
        result: String
        error: String # can be used to describe any error that occurred during the computation
      }
    `.trim(),
    resolvers: {
      Query: {
        search: async (_, { input: { query } }) => {
          try {
            const chain = RetrievalQAChain.fromLLM(llm, retriever);
            const { text } = await chain.invoke({ query });
            return { result: text };
          } catch (error) {
            return { error };
          }
        },
      },
      Mutation: {
        say: async (_, { input: { message } }) => {
          console.log(`${chalk.bold(`${agent.name}:`)} ${message}`);

          const reply = await inputPrompt({
            message: 'Human:'
          });

          return { reply };
        },
      },
    },
    history: [
      new Activity({ kind: ActivityKind.Observation, input: dedent /* yaml */`
        data:
          say:
          reply: How can you help me?
      ` })
    ],
    optimizer: new SimpleOptimizer(3000),
  });

  await agent.invoke();
};

main();