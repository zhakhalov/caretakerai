import { Database } from 'sqlite';
import yaml from 'yaml';
import dedent from 'dedent';
import { config } from 'dotenv';
import { Activity, ActivityKind, Agent } from '@caretakerai/agent';
import { AsciiTable3 } from 'ascii-table3';
import { ChatOpenAI } from '@langchain/openai';

config();

const objective = `
You are a Document Extractor Agent responsible for extracting specific information from documents according to provided instructions and database schema.

Your input:
1. Instructions specifying what to extract
2. Database schema defining table structure
3. Document content to analyze
4. Document name for reference

Extraction process:
- Extract data according to instructions
- INSERT data directly into the single table
- Pass empty string ("") into query if no data found
- Pass empty string ("") into query if extraction is complete

Data extraction guidelines:
- Always use INSERT statements only
- Follow schema-defined table structure
- Insert all relevant data points found
- Never calculate or aggregate values

Important notes:
- Follow provided extraction instructions precisely
- Use only columns defined in the schema
- You do not have permissions to modify schema or create new columns
- You do not have permissions to delete any data
- Do not use SELECT or UPDATE statements

Remember:
1. Follow extraction instructions
2. Use schema-defined structure
3. Only use INSERT statements
4. Pass empty string when done or no data found
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

    """
    The name or identifier of the document being processed.
    This can be used for tracking or reference purposes.
    """
    documentName: String!
}

type Mutation {
  """
  Analyze the document and provide SQL statement(s) for the current extraction pass.
  Supports multi-pass extraction for entities and their related records.

  """
  extract(
    """
    Complete SQLite statement(s) for the current extraction pass:
    - SQL statement(s) when data is found (only INSERT clauses)
    - Empty string ("") to signal extraction completion

    IMPORTANT: this field must be wrapped in triple double-quotes
    """
    sql: String!
  ): ExtractionResult!
}

"""
Result type for document extraction
"""
type ExtractionResult {
  """
  Result of the executed SQL query, if any
  """
  queryResult: String!
  """
  Status of the query execution (e.g., success or error)
  """
  status: String!
}
`.trim();

// Configure LLM model
const llm = new ChatOpenAI({
  model: 'gpt-4o-mini',
  callbacks: [{ handleLLMStart: (_, [prompt]) => {
    console.log('==============================\n\nExtractor\n\n==============================',prompt)
  } }]
});

type ProcessDocumentInputs = {
  db: Database,
  instructions: string,
  document: string,
  documentName: string,
  schema: string,
}

export async function extract({ db, instructions, document, documentName, schema }: ProcessDocumentInputs) {
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
    examples: [
      new Activity({
        kind: ActivityKind.Action,
        input: dedent`
          mutation {
            extract(sql: """
              SELECT name FROM entities WHERE name = "Awesome entity"
            """) {
              status
              queryResult
            }
          }
        `
      })
    ],
    optimizers: [],
    // We start with an Observation activity containing the input data because:
    // 1. It provides the agent with its initial context in a structured format
    // 2. YAML format makes the data easily readable for the LLM
    // 3. This matches the agent's expected workflow of receiving and processing observations
    history: [
      new Activity({
        kind: ActivityKind.Observation,
        input: yaml.stringify({
          data: { instructions, document, schema, documentName },
        }),
      }),
    ],
    // Implementation of GraphQL operations
    resolvers: {
      Query: {
      },
      Mutation: {
        extract: async (_, { sql }) => {
          // empty query indicates complete extraction
          if (sql.trim() === '') {
            controller.abort(null);

            const table = new AsciiTable3()
              .setHeading(['No rows output.']);

            return { status: 'success', queryResult: table.toString() };
          }

          const results = await db.all(sql);

          if (!results.length) {
            const table = new AsciiTable3()
              .setHeading(['No rows output.']);

            return { status: 'success', queryResult: table.toString() };
          }

          const headers = Object.keys(results[0]);
          const rows = results.map(row => Object.values(row));

          const table = new AsciiTable3()
            .setHeading(...headers)
            .addRowMatrix(rows);

          return { status: 'success', queryResult: table.toString() };
        }
      }
    }
  });

  try {
    await agent.invoke();
  } catch (err) {
    if (err === null) {
      return
    }

    throw err;
  }
}
