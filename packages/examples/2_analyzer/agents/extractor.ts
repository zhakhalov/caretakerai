import { Database } from 'sqlite';
import yaml from 'yaml';
import { config } from 'dotenv';
import { Activity, ActivityKind, Agent } from '@caretakerai/agent';
import { LengthOptimizer, RemoveErrorActivitiesOptimizer } from '@caretakerai/optimizer';
import { ChatOpenAI } from '@langchain/openai';

config();

const objective = `
You are a Document Extractor Agent responsible for extracting specific information from document and inserting it into a predefined database schema.

Your workflow:
1. You will receive:
   - A document to analyze
   - The database schema structure to extract data into
   - Specific instructions about what information to extract

2. For each document:
   - Carefully read and understand the content
   - Identify information that matches the extraction criteria
   - Structure the extracted data to match the provided database schema
   - Insert valid data into the appropriate tables
   - Skip insertion if no relevant information is found

3. Data quality guidelines:
   - Only extract information that matches the schema and instructions with high confidence
   - Maintain data consistency with the defined column types
   - Do not modify or delete existing data
   - Do not alter the database schema

Important notes:
- You are a specialized extractor focused solely on extraction and insertion
- You don't need to create or modify the database schema
- You don't need to perform analysis or answer questions
- Your success is measured by accurate extraction and proper data insertion

Remember: Extract precisely, insert accurately, maintain data integrity.
`.trim();

const typeDefs = /* GraphQL */`
type Query {
    """
    Database schema definition showing available tables and their structures.
    Example: CREATE TABLE people (name TEXT, age INTEGER);
    """
    schema: String!

    """
    Specific instructions about what information to extract from the document.
    Example: "Extract people's names and ages from the text."
    """
    instruction: String!

    """
    The document to analyze.
    This is the text content from which information should be extracted.
    """
    document: String!
}

type Mutation {
  """
  Analyzes the document and returns a SQL INSERT statement if relevant data is found.
  It's normal and expected that some documents won't contain any matching information.

  Returns:
  - A complete INSERT statement if relevant data was found
  - An empty string if no relevant data was found in the document

  Example: INSERT INTO people (name, age) VALUES ('John', 25), ('Jane', 30);
  """
  extract(
    """
    Complete SQLite INSERT statement with all values directly included,
    or empty string if no relevant data was found.
    """
    sql: String!
  ): ID!
}
`.trim();

// Configure LLM model
const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
});

type ProcessDocumentInputs = {
  db: Database,
  instructions: string,
  document: string,
  schema: string,
}

export async function extract({ db, instructions, document, schema }: ProcessDocumentInputs) {
  // abort controller to break agent action loop
  const controller = new AbortController();

  // Configure agentic application
  const agent = new Agent({
    llm, // Language model instance for processing queries
    objective, // Define agent's behavior and responsibilities (from objective string above)
    maxRetries: 3, // Number of retry attempts for failed operations or LLM completions
    typeDefs, // GraphQL schema defining available operations
    signal: controller.signal, // break agent action loop early
    // This interation should be zero-shot. Even if the agent fail to execute GraphQL query once it will correct itself on next iteration
    examples: [],
    // We start with an Observation activity containing the input data because:
    // 1. It provides the agent with its initial context in a structured format
    // 2. YAML format makes the data easily readable for the LLM
    // 3. This matches the agent's expected workflow of receiving and processing observations
    history: [
      new Activity({
        kind: ActivityKind.Observation,
        input: yaml.stringify({
          data: { instructions, fragment: document, schema },
        }),
      }),
    ],
    // Implementation of GraphQL operations
    resolvers: {
      Query: {
      },
      Mutation: {
        extract: async (_, { sql }) => {
          try {
            controller.abort(null); // break agent action loop

            if (sql.trim() === '') {
              return null;
            }

            // Execute the INSERT statement
            await db.exec(sql);
            return null;
          } catch (error) {
          }
        }
      }
    }
  });

  await agent.invoke();
}
