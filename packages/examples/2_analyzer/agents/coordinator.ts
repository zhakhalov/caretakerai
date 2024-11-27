import { resolve } from 'path';
import chalk from 'chalk';
import yaml from 'yaml';
import { Database } from 'sqlite';
import { Database as DatabaseDriver } from 'sqlite3';
import inputPrompt from '@inquirer/input';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Activity, ActivityKind, Agent } from '@caretakerai/agent';
import { LengthOptimizer, RemoveErrorActivitiesOptimizer } from '@caretakerai/optimizer';
import { ChatOpenAI } from '@langchain/openai';
import { extract } from './extractor';

const objective = `
You are a Document Analysis Coordinator Agent responsible for orchestrating the analysis of documents to answer analytical questions.

Your workflow:
1. First, understand the user's analytical question clearly
2. Design an appropriate SQLite database schema that will store the relevant information from the document
   - Create tables that capture the necessary data points
   - Add appropriate columns and relationships
   - Include clear comments for each table and column

3. Coordinate the document analysis process:
   - Break down the document into processable fragments
   - Deploy sub-agents to extract and insert data from each fragment
   - Monitor the data collection progress

4. Once data collection is complete:
   - Write and execute SQL queries to analyze the collected data
   - Synthesize the results to answer the original question
   - Present findings clearly to the user

Important guidelines:
- Always explain your reasoning for the database schema design
- Verify that the schema can capture all necessary information
- Ensure SQL queries are optimized for the analytical question
- Maintain clear communication with the user throughout the process

Remember: Your role is to coordinate and synthesize, while sub-agents handle the actual document processing.
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
    database: String!,

    """
    SQL query to retrieve the answer to the user's question from the database
    """
    query: String!
  ): SQLExecutionResult!
}

type Mutation {
  """
  Sends a message to the user and waits for their response
  """
  say(prompt: String!): UserResponse!

  """
  Defines a new SQLite database schema
  """
  defineDatabase(
    """
    Name for the new database. Will be used to reference this database in future queries
    """
    dbName: String!,

     """
    SQL statements to define the database schema. Wrap this parameter in triple double-quotes always.
    Provide comments to every defined table and attribute.

    Example:
    -- Table: employees
    -- Stores basic employee information and their department assignments
    CREATE TABLE employees (
      -- Unique identifier for each employee
      id INTEGER PRIMARY KEY,
      -- Employee's full name
      name TEXT NOT NULL,
      -- Employee's job title or position
      title TEXT,
      -- Employee's department ID (references departments table)
      department_id INTEGER,
      -- Date when the employee joined the company (YYYY-MM-DD)
      hire_date DATE
    );

    -- Table: departments
    -- Contains information about company departments
    CREATE TABLE departments (
      -- Unique identifier for each department
      id INTEGER PRIMARY KEY,
      -- Department name
      name TEXT NOT NULL,
      -- Brief description of the department's function
      description TEXT,
      -- Location or floor where the department is situated
      location TEXT
    );
    """
    definitionQuery: String!
  ): DatabaseDefinitionResult!

  """
  Invokes a Document Extractor Agent to process a document fragment.
  The agent will:
  1. Extract information according to the provided instructions
  2. Insert relevant data into the database if found
  3. Return true if processing completed (regardless of whether data was found)
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
  ): Boolean!
}

"""
Response type from user communication
"""
type UserResponse {
  """
  The user's response to the prompt
  """
  response: String!
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
Result type for executing SQL operations
"""
type SQLExecutionResult {
  """
  The result of the query executed on the database
  """
  queryResult: String
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
  const loader = new DirectoryLoader(resolve(process.cwd(), '2_analyzer/docs'), {
    '.md': (path) => new TextLoader(path)
  });

  // const splitter = RecursiveCharacterTextSplitter.fromLanguage('markdown', {
  //   chunkSize: 1000,
  //   chunkOverlap: 100
  // });

  debugger

  let documents = await loader.load();

  // Configure LLM model
  const llm = new ChatOpenAI({
    model: 'gpt-4o-mini',
  });

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
        executeSQL: async (_, { dbName, query }) => {
          try {
            // Execute the SQL query on the temporary database
            const result = await dbs[dbName].db.all(query);
            return { queryResult: JSON.stringify(result) };
          } catch (error) {
            throw new Error(`SQL execution failed: ${error.message}`);
          }
        }
      },
      Mutation: {
        say: async (_, { message }) => {
          console.log(`${chalk.bold(`AI:`)} ${message}`);
          const reply = await inputPrompt({ message: 'Human:' });
          return { reply };
        },
        defineDatabase: async (_, { dbName, definitionQuery }) => {
          try {
            const db = new Database({ driver: DatabaseDriver, filename: ':memory:' });
            dbs[dbName] = { db, schema: definitionQuery };

            // Execute the schema definition queries
            await db.exec(definitionQuery);
            return { status: 'success' };
          } catch (error) {
            throw new Error(`Database definition failed: ${error.message}`);
          }
        },
        extract: async (_, { dbName, instructions }) => {
          try {
            const { db, schema } = dbs[dbName];

            // Run extraction agents over each document fragment to extract data and insert into database
            await Promise.all(documents.map(({ pageContent }) => extract({ db, instructions, schema, document: pageContent })));
            return true;
          } catch (error) {
            throw new Error(`Document processing failed: ${error.message}`);
          }
        }
      }
    }
  });

  return agent;
}
