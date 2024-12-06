import { resolve, dirname } from 'path';
import chalk from 'chalk';
import yaml from 'yaml';
import pino from 'pino';
import { open, Database } from 'sqlite';
import { Database as SQLite3Database } from 'sqlite3';
import { AsciiTable3 } from 'ascii-table3';
import inputPrompt from '@inquirer/input';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { Activity, ActivityKind, Agent } from '@caretakerai/agent';
import { LengthOptimizer, RemoveErrorActivitiesOptimizer } from '@caretakerai/optimizer';
import { ChatOpenAI } from '@langchain/openai';
import { extract } from './extractor';

const objective = `
You are a Document Analysis Coordinator Agent responsible for orchestrating the analysis of documents and answering questions about the analyzed data.

**Your workflow:**
1. For any question about data:
  - Check if you have previously created a database for this type of information
  - If no relevant database exists:
    a. Create a single table with all necessary columns
    b. ALWAYS extract data from documents before querying
    c. Never query an empty database

2. When creating new databases:
  - Design a single comprehensive table that includes all data points
  - Include all attributes, measurements, and timestamps in the same table
  - ALWAYS document each column with clear comments to guide data extraction
  - Comments should explain the purpose and expected content of each field
    - Example structure:
    * data_table (
        -- Unique identifier for each record. Auto-incrementing number --
        id INTEGER PRIMARY KEY,
        -- ISO timestamp when the data point was recorded (YYYY-MM-DD HH:MM:SS) --
        timestamp DATE,
        -- Full name or identifier of the entity this record describes --
        entity_name TEXT,
        -- Main classification or type of the entity (e.g., department, product type) --
        category TEXT,
        -- Primary numeric value being recorded. Include units when relevant --
        measurement REAL,
        -- Detailed explanation or notes about this specific record --
        description TEXT,
        -- Where this data came from (e.g., document name, system name) --
        source TEXT,
        -- Add additional columns as needed, always with detailed comments --
        ... other relevant columns
      )

3. For document analysis:
  - Extract all relevant data into the single table
  - Track which database was created for what purpose
  - ALWAYS run extraction before attempting any queries

4. For querying data:
  - Use flexible text matching (LIKE '%term%') for text searches
  - Use exact matches for numeric and date comparisons
  - Consider variations in naming and terminology
  - Always explain query approach in thoughts

**Important guidelines:**
- Only query databases you have explicitly created and tracked
- Store all related information in a single table
- Include all necessary columns in the main table
- Never create separate related tables
- Maintain clear documentation of created schemas
- Never skip the data extraction step

**Remember: The workflow must always be:**
1. Create single-table database (if needed)
2. Extract data from documents
3. Only then query the populated database
`.trim();

const typeDefs = /* GraphQL */`
type Query {
  """
  Executes SQL query on a specific database to extract the answer
  """
  executeSQL(
    """
    Name of the database to query
    """
    dbName: String!,

    """
    SQL query to retrieve the answer to the user's question from the database

    IMPORTANT: this field must be wrapped in triple double-quotes
    """
    query: String!
  ): SQLExecutionResult!
}

type Mutation {

  """
  Sends a message to the user and waits for their response
  """
  say(message: String!): UserResponse!

  """
  Defines a new SQLite database schema
  """
  defineDatabase(
    """
    Name for the new database. Will be used to reference this database in future queries
    """
    dbName: String!,

    """
    Defines a new SQLite database schema. Follow these rules:
    1. Design a single comprehensive table that includes all data points
    2. Include all attributes, measurements, and timestamps in the same table
    3. Store denormalized data - duplication is preferred over table joins
    4. Document each column with clear comments

    Example structure:
    * data_table (
      -- Unique identifier for each record --
      id INTEGER PRIMARY KEY,
      -- When the data was recorded --
      timestamp DATE,
      -- Name of the entity being described --
      entity_name TEXT,
      -- Classification or grouping --
      category TEXT,
      -- Numeric measurement value --
      measurement REAL,
      -- Detailed description of the record --
      description TEXT,
      -- Origin of the data --
      source TEXT,
      ... other relevant columns
    )

    IMPORTANT: this field must be wrapped in triple double-quotes
    """
    definitionQuery: String!
  ): DatabaseDefinitionResult!

  """
  Invokes a Document Extractor Agent to process a document fragment.
  The agent will:
  1. Extract information according to the provided instructions
  2. Insert relevant data into the database if found
  3. Return inserted record IDs for tracking and reference
  4. Process each document independently

  The extractor agent receives:
  - Database instance for data insertion
  - Database schema for understanding the data structure
  - Instructions for what to extract
  - Document content to analyze
  - Document name for reference

  Returns:
  - Array of inserted record IDs
  - Empty array if no data was found
  - Maintains independent processing of each document
  """
  extract(
    """
    Name of the database to insert data into
    """
    dbName: String!,

    """
    Instructions for the Document Analysis Agent specifying what information
    to look for and how it should be structured for database insertion
    """
    instructions: String!
  ): ExtractionResult!
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
Result type for database schema definition
"""
type DatabaseDefinitionResult {
  """
  Status of the database schema creation (e.g., success or error)
  """
  status: String!
}

"""
Result type for document extraction
"""
type ExtractionResult {
  """
  Status of the extraction process (e.g., success or error)
  """
  status: String!
}

"""
Result type for executing SQL operations
"""
type SQLExecutionResult {
  """
  The result of the query executed on the database
  """
  queryResult: String
  """
  Status of the query execution (e.g., success or error)
  """
  status: String!
}
`.trim();

type DatabaseWithSchema = {
  db: Database,
  schema: string,
}

export async function createAgent() {
  // Setup in-memory databases
  const dbs: Record<string, DatabaseWithSchema> = {};

  // Load documents to tack with
  const loader = new DirectoryLoader(resolve(process.cwd(), '2_idp/docs'), {
    '.md': (path) => new TextLoader(path)
  });

  let documents = await loader.load();

  // Configure LLM model
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
    callbacks: [{ handleLLMStart: (_, [prompt]) => {
      console.log(prompt)
    } }]
  });

  // Configure agentic application
  const agent = new Agent({
    llm, // Language model instance for processing queries
    objective, // Define agent's behavior and responsibilities (from objective string above)
    maxRetries: 3, // Number of retry attempts for failed operations or LLM completions
    logger: pino(),
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
        executeSQL: async (_, { dbName, query }) => {
          // Execute the SQL query on the temporary database
          const results = await dbs[dbName].db.all(query);
          const table = new AsciiTable3()

          if (!results.length) {
            table.setHeading(['No rows output.']);
          } else {
            const headers = Object.keys(results[0]);
            const rows = results.map(row => Object.values(row));

            table
              .setHeading(...headers)
              .addRowMatrix(rows);
          }

          return { status: 'success', queryResult: table.toString() };
        }
      },
      Mutation: {
        say: async (_, { message }) => {
          console.log(`${chalk.bold(`AI:`)} ${message}`);
          const reply = await inputPrompt({ message: 'Human:' });
          return { reply };
        },
        defineDatabase: async (_, { dbName, definitionQuery }) => {
          const db = await open({
            driver: SQLite3Database,
            filename: ':memory:',
          });

          dbs[dbName] = { db, schema: definitionQuery };

          // Execute the schema definition queries
          await db.exec(definitionQuery);
          return { status: 'success' };
        },
        extract: async (_, { dbName, instructions }) => {
          const { db, schema } = dbs[dbName];

          // Run extraction agents over each document fragment to extract data and insert into database
          await Promise.all(documents.map(({ pageContent, metadata }) => extract({
            db,
            instructions,
            schema,
            document: pageContent,
            documentName: metadata.source.replace(dirname(metadata.source), '')
          })));

          return { status: 'success' };
        }
      }
    }
  });

  return agent;
}
