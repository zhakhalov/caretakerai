import { driver, auth } from 'neo4j-driver';
import yaml from 'yaml';
import dedent from 'dedent';
import { config } from 'dotenv';
import { Activity, ActivityKind, Agent } from '@caretakerai/agent';
import { ChatOpenAI } from '@langchain/openai';
import { OpenAIEmbeddings } from '@langchain/openai';

config();
const objective = `
You are a Zettelkasten Note Extraction Agent responsible for converting documents into concise, atomic notes following the Zettelkasten method, with appropriate tags and descriptions.

**Your input:**
1. Document content to analyze
2. Document name for reference

**Extraction process:**
Phase 1 - Note Suggestion:
- Break down document into multiple atomic notes
- Each note should capture a single, clear concept
- Extract as many notes as needed to cover all important concepts
- Suggest relevant tags for each note
- Provide descriptions for suggested tags (only for tags actually used in notes)
- Submit suggestions using suggestNotes mutation
- Review returned similarTags for existing tags in the system

Phase 2 - Note Creation:
- Create final notes using existing tags where possible
- Create new tags only when necessary and only for tags used in notes
- Submit final notes using createNotes mutation

**Data extraction guidelines:**
- Each note should be atomic (one clear concept)
- Maximum 3 sentences per note
- No limit on number of notes - create as many as needed
- Tags should be concise and reusable
- Tag descriptions should clearly explain the concept (up to 3 sentences)
- Notes should collectively capture all important information from the source
- Only suggest tags that are actually used in notes
- Every tag in the tags array must be referenced by at least one note

**Example of correct Phase 1 mutation:**
mutation {
  suggestNotes(
    notes: [
      { note: "First atomic note content", tags: ["tag1", "tag2"] },
      { note: "Second atomic note content", tags: ["tag2", "tag3"] }
    ],
    tags: [
      { tag: "tag1", description: "Description of first concept" },
      { tag: "tag2", description: "Description of second concept" },
      { tag: "tag3", description: "Description of third concept" }
    ]
  ) {
    similarTags { tag description }
  }
}

**Example of correct Phase 2 mutation:**
mutation {
  createNotes(
    notes: [
      { note: "First atomic note content", tags: ["existing_tag", "new_tag1"] },
      { note: "Second atomic note content", tags: ["new_tag1", "new_tag2"] }
    ],
    tags: [
      { tag: "new_tag1", description: "Description of first new concept" },
      { tag: "new_tag2", description: "Description of second new concept" }
    ]
  ) {
    notes { id }
  }
}

**Important notes:**
- Break down complex ideas into multiple atomic notes
- Keep each note focused on a single concept
- Create as many notes as needed for complete coverage
- Reuse existing tags as much as possible
- Create new tags only when necessary
- Always provide descriptions for new tags
- Maximum 3 sentences for notes and descriptions
- Only include tags that are referenced by at least one note
- Every tag in the tags array must be used in at least one note
- Never suggest tags that aren't used in any notes

**Remember:**
1. Extract all relevant atomic notes
2. Suggest appropriate tags for each note
3. Review similar existing tags
4. Create final notes with optimal tag combination
5. Ensure complete coverage of source material
6. Only include tags that are actually used in notes
`.trim();

const typeDefs = /* GraphQL */`
type Query {
  """
  Returns the current document to be processed into Zettelkasten notes
  """
  document: String!
}

type Mutation {
  """
  Phase 1: Suggest notes and tags, receiving similar existing tags in response
  """
  suggestNotes(
    """
    Array of proposed notes with their suggested tags
    """
    notes: [NoteInput!]!
    """
    Array of proposed tags with their descriptions
    """
    tags: [TagInput!]!
  ): SuggestNotesResult!

  """
  Phase 2: Create the final notes and any necessary new tags
  """
  createNotes(
    """
    Array of final notes with their selected tags
    """
    notes: [NoteInput!]!
    """
    Array of new tags to be created (existing tags should not be included)
    """
    tags: [TagInput!]!
  ): CreateNotesResult!
}

"""
Input type for creating a note
"""
input NoteInput {
  """
  The note content (maximum 3 sentences)
  """
  note: String!
  """
  Array of tags associated with this note
  """
  tags: [String!]!
}

"""
Input type for creating a tag
"""
input TagInput {
  """
  The tag name
  """
  tag: String!
  """
  Description of the tag (maximum 3 sentences)
  """
  description: String!
}

"""
Result type for note suggestion phase
"""
type SuggestNotesResult {
  """
  Array of existing similar tags in the system
  """
  similarTags: [Tag!]!
}

"""
Result type for note creation phase
"""
type CreateNotesResult {
  """
  Array of created notes with their IDs
  """
  notes: [Note!]!
}

"""
Tag type representing an existing tag in the system
"""
type Tag {
  """
  The tag name
  """
  tag: String!
  """
  Description of the tag
  """
  description: String!
}

"""
Note type representing a created note
"""
type Note {
  """
  Unique identifier for the note
  """
  id: ID!
}
`.trim();

type ProcessDocumentInputs = {
  document: string,
  documentName: string,
}

type NoteInput = {
  /** The note content (maximum 3 sentences) */
  note: string;
  /** Array of tags associated with this note */
  tags: string[];
}

type TagInput = {
  /** The tag name */
  tag: string;
  /** Description of the tag (maximum 3 sentences) */
  description: string;
}

// Configure LLM model
const llm = new ChatOpenAI({
  model: 'gpt-4o',
  callbacks: [{ handleLLMStart: (_, [prompt]) => {
    console.log(prompt)
  } }]
});

export async function extract({ document, documentName }: ProcessDocumentInputs) {
  console.log(`Indexing ${documentName}...`);

  const conn = driver(
    process.env.NEO4J_URI!,
    auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
  );

  // Define vector indices if they do not exist
  const session = conn.session();

  try {
    await session.run(
      /* cypher */ `
        // Create vector index for Tag nodes if it does not exist
        CREATE VECTOR INDEX tags IF NOT EXISTS
        FOR (t:Tag) ON (t.embedding)
        OPTIONS {indexConfig: { \`vector.dimensions\`: 512, \`vector.similarity_function\`: 'COSINE' }}
      `
    );

    await session.run(
      /* cypher */ `
        // Create vector index for Note nodes if it does not exist
        CREATE VECTOR INDEX notes IF NOT EXISTS
        FOR (n:Note) ON (n.embedding)
        OPTIONS {indexConfig: { \`vector.dimensions\`: 512, \`vector.similarity_function\`: 'COSINE' }}
      `
    );

    await session.run(
      /* cypher */ `
        // Create Document node
        CREATE (d:Document {name: $documentName})
      `,
      { documentName }
    );
  } finally {
    await session.close();
  }

  // Configure agentic application
  const agent = new Agent({
    llm, // Language model instance for processing queries
    objective, // Define agent's behavior and responsibilities (from objective string above)
    maxRetries: 3, // Number of retry attempts for failed operations or LLM completions
    typeDefs, // GraphQL schema defining available operations
    // This interation should be zero-shot. Even if the agent fail to execute GraphQL query once it will correct itself on next iteration
    examples: [
      new Activity({
        kind: ActivityKind.Action,
        input: dedent(/* GraphQL */`
          mutation {
            suggestNotes(
              notes: [
                { note: "First atomic note content", tags: [ "concept1", "concept2" ] },
                { note: "Second atomic note content", tags: [ "concept2", "concept3" ] },
                { note: "Third atomic note content", tags: [ "concept1", "concept4" ] }
              ],
              tags: [
                { tag: "concept1", description: "Description of concept1" },
                { tag: "concept2", description: "Description of concept2" },
                { tag: "concept3", description: "Description of concept3" },
                { tag: "concept4", description: "Description of concept4" }
              ]
            ) {
              similarTags { tag, description }
            }
        }`).trim()
      })
    ],
    optimizers: [],
    // We start with an Observation activity containing the input data because:
    // 1. It provides the agent with its initial context in a structured format
    // 2. This matches the agent's expected workflow of receiving and processing observations
    history: [
      new Activity({
        kind: ActivityKind.Observation,
        input: yaml.stringify({
          data: { document },
        }),
      }),
    ],
    // Implementation of GraphQL operations
    resolvers: {
      Query: {
      },
      Mutation: {
        suggestNotes: async (_, { notes, tags }: { notes: NoteInput[], tags: TagInput[] }) => {
          // Initialize OpenAIEmbeddings
          const embeddings = new OpenAIEmbeddings({
            model: 'text-embedding-3-small',
            dimensions: 512,
          });

          const session = conn.session();

          try {
            console.log('Finding similar tags...');

            // Get vector representations for all tags in parallel
            const tagVectors = await Promise.all(
              tags.map(async tag => await embeddings.embedQuery(tag.description))
            );

            const result = await session.run(
              /* cypher */`
                UNWIND $tagVectors AS tagVector
                CALL db.index.vector.queryNodes('tags', 15, tagVector) YIELD node, score
                WITH DISTINCT node.name AS tag, node.description AS description
                RETURN tag, description
                LIMIT 15
              `,
              { tagVectors }
            );

            const similarTags = result.records.map(record => ({
              tag: record.get('tag'),
              description: record.get('description'),
            }));

            return { similarTags };
          } finally {
            await session.close();
          }
        },

        createNotes: async (_, { notes, tags }: { notes: NoteInput[], tags: TagInput[] }) => {
          const session = conn.session();
          const tx = session.beginTransaction();

          const embeddings = new OpenAIEmbeddings({
            model: 'text-embedding-3-small',
            dimensions: 512,
          });

          try {
            console.log(`Creating ${tags.length} new tags...`);

              // Create only new tags with embeddings
              await Promise.all(
              tags.map(async tag => {
                console.log(`  Generating embedding for tag: ${tag.tag}`);
                const embedding = await embeddings.embedQuery(tag.description);

                console.log(`  Creating tag in database: ${tag.tag}`);
                return tx.run(
                  /* cypher */ `
                    CREATE (t:Tag {name: $name, description: $description, embedding: $embedding})
                  `,
                  {
                    name: tag.tag,
                    description: tag.description,
                    embedding,
                    documentName
                  }
                );
              })
            );

            console.log(`Creating ${notes.length} new notes...`);

            // Create notes and link them to tags, with embeddings
            const createdNotes = await Promise.all(
              notes.map(async note => {
                console.log(`  Generating embedding for note: "${note.note.slice(0, 50)}..."`);
                const embedding = await embeddings.embedQuery(note.note);

                console.log(`  Creating note and linking to tags: [${note.tags.join(', ')}]`);
                const result = await tx.run(
                  /* cypher */`
                    CREATE (n:Note {content: $content, embedding: $embedding})
                    WITH n
                    MATCH (d:Document {name: $documentName})
                    CREATE (n)-[:EXTRACTED_FROM]->(d)
                    WITH n
                    UNWIND $tags AS tagName
                    MATCH (t:Tag {name: tagName})
                    MERGE (n)-[:TAGGED_WITH]->(t)
                    RETURN n
                  `,
                  {
                    content: note.note,
                    tags: note.tags,
                    embedding,
                    documentName
                  }
                );

                const noteId = result.records[0].get('n').identity.toString();
                console.log(`  Created note with ID: ${noteId}`);
                return { id: noteId };
              })
            );

            console.log('Committing transaction...');
            await tx.commit();
            console.log('All notes and tags created successfully!');
            agent.cancel();
            return { notes: createdNotes };
          } catch (error) {
            console.error('Error occurred, rolling back transaction:', error);
            await tx.rollback();
            throw error;
          } finally {
            await session.close();
            await conn.close();
          }
        }
      }
    }
  });

  await agent.invoke();
}
