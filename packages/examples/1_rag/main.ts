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

**Your responsibilities:**
1. Help users find accurate information through intelligent searching
2. Break down complex questions into multiple focused searches
3. Synthesize information from multiple sources when needed
4. Present information in a clear, readable format

**Search guidelines:**
- Limit searches to 7 attempts per question
- Ensure each search query is unique
- Use the user's language style in queries
- Break complex questions into multiple targeted searches

**Answer formatting:**
- Keep responses under 300 words
- Structure answers in clear paragraphs
- Prefer descriptive prose over bullet points
- Use the user's language style in responses
- Include relevant context and explanations

**Remember to:**
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
  Searches the knowledge base and returns relevant text passages.
  Supports single concept searches, multiple parallel searches,
  full-text content matching, and semantic similarity matching.
  """
  search(input: SearchInput!): SearchResult!
}

type Mutation {
  """
  Sends a message to the user's console and captures their typed response.
  Displays formatted text messages and returns the complete user input.
  """
  say(message: String!): UserResponse!
}

"""
Search parameters for querying the knowledge base
"""
input SearchInput {
  """
  Text query that will be matched against the document content.
  Supports both exact and semantic matching.
  """
  query: String!
}

"""
Container for user interaction responses
"""
type UserResponse {
  """
  The complete text entered by the user at the console prompt
  """
  reply: String!
}

"""
Container for search operation results
"""
type SearchResult {
  """
  Collection of relevant text passages from the knowledge base.
  Returns up to 5 most relevant matches.
  """
  results: [String]!
}
`.trim();

// Configure LLM model
const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  callbacks: [{ handleLLMStart: (_, [prompt]) => {
    console.log(prompt)
  } }]
});

async function main() {
  // Configure document store
  // const store = await fromDocuments(); // Create new index from documents
  const store = await fromExistingIndex(); // Alternative: Load existing vector index

  // Configure agentic application
  const agent = new Agent({
    llm, // Language model instance for processing queries
    objective, // Define agent's behavior and responsibilities (from objective string above)
    maxRetries: 3, // Number of retry attempts for failed operations or LLM completions
    typeDefs, // GraphQL schema defining available operations
    optimizers: [
      new RemoveErrorActivitiesOptimizer(), // Forget interactions that resulted in syntax or execution errors
      new LengthOptimizer(32), // Limit interaction history to 16 activities
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
          const docs = await store.similaritySearch(query, 3);
          const results = docs.map(({ pageContent }) => pageContent)
          return { results };
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

  await agent.invoke();
}

// Start application
main();
