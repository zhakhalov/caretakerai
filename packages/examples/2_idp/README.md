# Building an Intelligent Document Processing System with @caretaker/agent

Agentic applications empower AI to interact with complex datasets, dissect intricate tasks, and transform raw information into actionable insights. Our Intelligent Document Processing (IDP) application exemplifies this capability by orchestrating a multi-agent system that efficiently analyzes and manages large volumes of documents. Utilizing the `@caretaker/agent` framework, this application integrates and coordinates specialized agents to provide clarity, accuracy, and speed in document processing—paving the way for innovative uses across a multitude of industries.

### Working with SQLite

Central to our system is SQLite, a lightweight and efficient database management tool that handles the data extracted from documents. Using a structured database schema, SQLite ensures rapid access and retrieval of information, making it ideal for managing large volumes of data. With SQLite, our agents can quickly navigate through extensive datasets, maintaining consistency and accuracy, which is crucial when analyzing numerous documents.


### Practical Interaction Example

Consider the following interaction, where a user requests a revenue breakdown by client. This demonstrates how the multi-agent system effectively handles and resolves such queries:

````md
<BEGIN OBSERVATION>
```yaml
data:
  say:
    reply: show me a revenue breakdown by client
```
<END OBSERVATION>
<BEGIN THOUGHT>
The user has requested a revenue breakdown by client. I need to check if I have a relevant database created that contains this information.

Since I haven't checked for the existence of such a database yet, I will proceed to create a new one if it doesn't exist. This will involve defining a table structure that can hold the necessary details such as client names, revenue amounts, and timestamps for the records.

After creating the database schema, I will need to extract the relevant data from documents to populate the database with any available information related to revenue by client.

Next, I will create the database schema for the revenue breakdown.
<END THOUGHT>
<BEGIN ACTION>
```graphql
mutation {
  defineDatabase(dbName: "RevenueBreakdownByClient", definitionQuery: """
    CREATE TABLE revenue_breakdown (
      -- Unique identifier for each record --
      id INTEGER PRIMARY KEY,
      -- ISO timestamp when the revenue was recorded (YYYY-MM-DD HH:MM:SS) --
      timestamp DATE,
      -- Name of the client for this revenue record --
      client_name TEXT,
      -- The total revenue associated with the client --
      revenue_amount REAL,
      -- Detailed description or notes about this revenue record --
      description TEXT,
      -- The source of the revenue data (e.g., document name, system name) --
      source TEXT
    )
  """) {
    status
  }
}
```
<END ACTION>
<BEGIN OBSERVATION>
```yaml
data:
  defineDatabase:
    status: success
```
<END OBSERVATION>
<BEGIN THOUGHT>
The database for the revenue breakdown by client has been successfully created.

Next, I need to extract the relevant data from documents to populate this database with information regarding client revenues. I'll prepare the extraction instructions to gather necessary data from the documents and insert them into the new database.

I will now proceed to define the extraction instructions and initiate the extraction process for the documents regarding revenue by client.
<END THOUGHT>
<BEGIN ACTION>
```graphql
mutation {
  extract(dbName: "RevenueBreakdownByClient", instructions: "Extract revenue information by client, including client names, total revenue amounts, timestamps, descriptions, and sources.") {
    status
  }
}
```
<END ACTION>
<BEGIN OBSERVATION>
```yaml
data:
  extract:
    status: success
```
<END OBSERVATION>
<BEGIN THOUGHT>
The extraction process for gathering revenue information by client has been successfully completed. The database should now be populated with relevant data.

Next, I can proceed to query this newly populated database to provide the user with the requested revenue breakdown by client. I will make a SQL query to select all client names and their associated revenue amounts.

Now I'll formulate and execute this SQL query to retrieve the information from the database.
<END THOUGHT>
<BEGIN ACTION>
```graphql
query {
  executeSQL(dbName: "RevenueBreakdownByClient", query: """
    SELECT client_name, revenue_amount FROM revenue_breakdown
  """) {
    queryResult
    status
  }
}
```
<END ACTION>
<BEGIN OBSERVATION>
```yaml
data:
  executeSQL:
    queryResult: |
      +-----------------+----------------+
      |   client_name   | revenue_amount |
      +-----------------+----------------+
      | XYZ Corp        |        2061.06 |
      | Global Tech Ltd |        4394.08 |
      | XYZ Corp        |         460.04 |
      | 123 Industries  |        1329.13 |
      +-----------------+----------------+
    status: success
```
<END OBSERVATION>
<BEGIN THOUGHT>
The SQL query has successfully returned the revenue breakdown by client. The results include the client names along with their respective revenue amounts.

Now, I will format this data into a clear and concise message to present to the user. This will help in understanding the distribution of revenue among different clients.

Next, I will communicate the results to the user.
<END THOUGHT>
<BEGIN ACTION>
```graphql
mutation {
  say(message: """
    Here is the revenue breakdown by client:
    - **XYZ Corp**: $2061.06\n- **Global Tech Ltd**: $4394.08
    - **XYZ Corp**: $460.04\n- **123 Industries**: $1329.13
    Note: The figures represent the total revenue associated with each client.
  """) {
    reply
  }
}
```
<END ACTION>
````

This interaction illustrates how the IDP application efficiently coordinates between database definition, data extraction, and query execution to provide users with precise and actionable insights swiftly.

## Objective Structure

In the `@caretaker/agent` framework, establishing clear objectives is critical to guiding the behavior of each agent within a multi-agent system. Our Intelligent Document Processing (IDP) application accomplishes this with a structured approach that delineates precise roles and responsibilities for each agent involved in the document analysis workflow.

### Document Analysis Coordinator Agent

**1. Identity Statement**

```
You are a Document Analysis Coordinator Agent responsible for orchestrating the analysis of documents and answering questions about the analyzed data.
```

This statement defines the Coordinator Agent's role as the primary orchestrator in managing the lifecycle of document analysis.

**2. Core Responsibilities**

```
**Your workflow:**
1. For any question about data:
   - Check if you have previously created a database for this type of information
   - If no relevant database exists:
     a. Create a single table with all necessary columns
     b. ALWAYS extract data from documents before querying
     c. Never query an empty database

2. When creating new databases:
   - Design a single comprehensive table that includes all data points
   - Document each column with clear comments to guide data extraction

3. For document analysis:
   - Extract all relevant data into the single table

4. For querying data:
   - Use flexible text matching and exact matches for numeric and date comparisons
```

This section outlines the agent's responsibilities, ensuring that databases are properly created and maintained, and that data extraction precedes any queries.

**3. Behavioral Guidelines**

```
**Important guidelines:**
- Only query databases you have explicitly created and tracked
- Store all related information in a single table
- Maintain clear documentation of created schemas
- Never skip the data extraction step
```

These guidelines ensure the Coordinator Agent maintains a robust data management process, reinforcing consistency and traceability.

### Document Extractor Agent

**1. Identity Statement**

```
You are a Document Extractor Agent responsible for extracting specific information from documents according to provided instructions and database schema.
```

This statement establishes the Extractor Agent's role as the executor of precise data extraction from documents.

**2. Core Responsibilities**

```
**Your input:**
1. Instructions specifying what to extract
2. Database schema defining table structure
3. Document content to analyze
4. Document name for reference

**Extraction process:**
- Extract data according to instructions
- INSERT data directly into the single table
- Always use RETURNING id for all inserts
```

The responsibilities here emphasize extracting information with precision, adhering to schema instructions, and ensuring data integrity through correct SQL operations.

**3. Behavioral Guidelines**

```
**Important notes:**
- Follow provided extraction instructions precisely
- Use only columns defined in the schema
- Do not use SELECT or UPDATE statements
- Always include RETURNING id clause
```

These guidelines clarify the agent's operational constraints and ensure compliance with the schema's structure, avoiding unauthorized data manipulation.

## TypeDefs: Defining Agent Capabilities

In the `@caretaker/agent` framework, GraphQL schema definitions, or TypeDefs, define the specific operations an agent can perform. They serve as a contract between the application and its agents, outlining the interactions necessary to process, store, and retrieve information effectively.

### Core Operations

The TypeDefs facilitate various functionalities, enabling the agents to manage databases, process documents, and handle queries with precision.

#### Document Analysis Coordinator Agent

The Coordinator Agent is equipped with a set of operations designed to oversee the entire document analysis lifecycle:

1. **SQL Query Execution**

   ```graphql
   type Query {
     """
     Executes SQL query on a specific database to extract the answer
     """
     executeSQL(
       dbName: String!,
       query: String!
     ): SQLExecutionResult!
   }
   ```

   - **Purpose**: Allows the agent to perform queries on predefined databases to retrieve answers to user inquiries.
   - **Functionality**: Supports customized SQL queries, ensuring dynamic data retrieval tailored to the questions asked.

2. **Database Definition**

   ```graphql
   type Mutation {
     """
     Defines a new SQLite database schema
     """
     defineDatabase(
       dbName: String!,
       definitionQuery: String!
     ): DatabaseDefinitionResult!
   }
   ```

   - **Purpose**: Enables the creation of new database schemas when no existing schema can satisfy the analysis requirements.
   - **Functionality**: Supports comprehensive table designs, emphasizing denormalization and clear documentation.

3. **Data Extraction Invocation**

   ```graphql
   type Mutation {
     """
     Invokes a Document Extractor Agent to process a document fragment.
     """
     extract(
       dbName: String!,
       instructions: String!
     ): ExtractionResult!
   }
   ```

   - **Purpose**: Allows the agent to delegate document processing tasks to Extractor Agents, ensuring efficient data handling.
   - **Functionality**: Facilitates document processing based on predefined extraction instructions.

#### Document Extractor Agent

The Extractor Agent operates with operations that allow it to interact with the provided documents and execute specified extraction techniques:

1. **Document Analysis and SQL Statement Preparation**

   ```graphql
   type Mutation {
     """
     Analyze the document and provide SQL statement(s) for the current extraction pass.
     """
     extract(
       sql: String!
     ): ExtractionResult!
   }
   ```

   - **Purpose**: Enables the agent to insert new data into the corresponding database using precise SQL commands.
   - **Functionality**: Supports multi-pass extraction to increase the complexity and thoroughness of data captured.

### Schema Specification

```graphql
type Query {
  """
  Database schema definition showing available tables and their structures.
  """
  schema: String!

  """
  Specific instructions about what information to extract from the document.
  """
  instruction: String!

  """
  The document to analyze.
  """
  document: String!

  """
  The name or identifier of the document being processed.
  """
  documentName: String!
}
```

By aligning the TypeDefs with operational tasks, the IDP application ensures that all agents work efficiently and effectively, creating a robust, flexible, and user-responsive system.

### How It Works

A unique feature of the IDP application is the dynamic spawning and management of extractor agents by the Coordinator Agent:

1. **Initiation and Database Setup**: The Coordinator Agent first assesses the need for a new database schema based on document types. Once a decision is made, it defines the database structure using SQLite, ensuring it can support the anticipated data.

2. **Agent Orchestration**: Upon receiving a document batch, the Coordinator Agent spawns multiple Extractor Agents. Each of these is tasked with extracting specific data points from the documents using precise extraction instructions. The Extractor Agents employ a multi-pass extraction technique to handle complex data structures, incrementally refining their data capture through successive rounds of analysis. The Coordinator Agent ensures all Extractor Agents work concurrently and efficiently, processing each document and inserting relevant data into SQLite databases.

3. **Data Processing and Querying**: After extraction, the Coordinator Agent handles user queries. By executing SQL commands on the properly formatted SQLite databases, it can quickly retrieve and present queried data. This modular approach allows the system to scale, adjusting resource allocation based on workload demands.

### The Advantages of a Multi-Agent System

- **Scalability**: By deploying multiple agents, the system can handle extensive documents simultaneously, enhancing both speed and throughput.
- **Flexibility**: The system can adapt to different document types and structures, providing a versatile solution for document analysis across sectors.
- **Efficiency**: With SQLite's lightweight architecture, data processing becomes faster and more efficient, crucial for handling large datasets in real-time.
- **Comprehensive Data Extraction**: The Extractor Agent's multi-pass extraction capability ensures even complex datasets are thoroughly and accurately captured.

### Conclusion

The Intelligent Document Processing application stands as a testament to the transformative power of multi-agent systems. Through the deft coordination of specialized agents and the integration of efficient database management, this application not only simplifies document review but also empowers users with rapid, accurate insights. This approach represents the future of intelligent data handling, promising revolutionary improvements across diverse fields requiring complex document analysis.

By redefining how we manage and interpret vast amounts of information, multi-agent systems such as IDP pave the way for smarter, more agile data ecosystems.
