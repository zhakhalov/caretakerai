import chalk from 'chalk';
import yaml from 'yaml';
import inputPrompt from '@inquirer/input';
import { config } from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { Activity, ActivityKind, Agent } from '@caretakerai/agent';
import { RemoveErrorActivitiesOptimizer, LengthOptimizer } from '@caretakerai/optimizer';
import { fromDocuments, fromExistingIndex } from './store';

config();

const objective = `
You are an Information Retrieval Assistant that helps users find and synthesize information from documents.

Your responsibilities:
1. Help users find accurate information through intelligent searching
2. Break down complex questions into multiple focused searches
3. Synthesize information from multiple sources when needed
4. Present information in a clear, readable format

Search guidelines:
- Limit searches to 7 attempts per question
- Ensure each search query is unique
- Use the user's language style in queries
- Break complex questions into multiple targeted searches

Answer formatting:
- Keep responses under 300 words
- Structure answers in clear paragraphs
- Prefer descriptive prose over bullet points
- Use the user's language style in responses
- Include relevant context and explanations

Remember to:
- Start with a friendly introduction
- Explain your search strategy when relevant
- Verify information across multiple searches when needed
- Synthesize information rather than just quoting
- End when the user's question is fully answered
`.trim();

const typeDefs = /* GraphQL */`
schema {
  query: Query
  mutation: Mutation
}

type Query {
  """
  Perform text-searches in the knowledge base and return the results as strings.

  Example of breaking down complex questions:
  <Observation>
  data:
    say:
      reply: 'What is the difference between a white hole and a black hole?'
  </Observation>
  <Thought>
  I should split this complex question into separate searches for better understanding.
  </Thought>
  <Action>
  query {
    blackHole: search(input: { query: "What is a black hole?" }) { result }
    whiteHole: search(input: { query: "What is a white hole?" }) { result }
  }
  </Action>
  """
  search(input: SearchInput!): SearchResult!
}

type Mutation {
  """
  Sends a message to the user and waits for their response
  """
  say(message: String!): UserResponse!
}

"""
Input for search operations
"""
input SearchInput {
  """
  The search query to find relevant information
  """
  query: String!
}

"""
Response from user interaction
"""
type UserResponse {
  """
  The user's reply to the message
  """
  reply: String!
}

"""
Result from search operation
"""
type SearchResult {
  """
  The found information matching the query
  """
  result: String!
}
`.trim();

// Configure LLM model
const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
});

// Configure document store
const store = await fromDocuments(); // Alternative: create new index from documents
// const store = await fromExistingIndex(); // Alternative: load existing vector index

// Configure agentic application
const agent = new Agent({
  llm, // Language model instance for processing queries
  objective, // Define agent's behavior and responsibilities (from objective string above)
  maxRetries: 3, // Number of retry attempts for failed operations or LLM completions
  typeDefs, // GraphQL schema defining available operations
  optimizers: [
    new RemoveErrorActivitiesOptimizer(), // Forget interactions that resulted in syntax or execution errors
    new LengthOptimizer(16), // Limit interaction history to 16 activities
  ],
  // Initialize conversation greeting the agent
  history: [
    new Activity({
      kind: ActivityKind.Observation,
      input: yaml.stringify({
        data: {
          say: {
            reply: 'Hi!, how can you help me?',
          },
        },
      }),
    }),
  ],
  // Implementation of GraphQL operations
  resolvers: {
    Query: {
      search: async (_, { input: { query } }) => {
        const results = await store.similaritySearch(query, 5);
        return { result: results.map(({ pageContent }) => `* ${pageContent}\n\n`) };
      },
    },
    Mutation: {
      say: async (_, { message }) => {
        console.log(`${chalk.bold(`AI:`)} ${message}`);
        const reply = await inputPrompt({ message: 'Human:' });
        return { reply };
      },
    }
  },
});

// Start application
(async () => { await agent.invoke(); })();
