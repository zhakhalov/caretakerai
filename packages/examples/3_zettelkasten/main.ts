import { resolve, sep } from 'path';
import { driver, auth } from 'neo4j-driver';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { extract } from './agents/extractor';
import { AgentRetryError } from '@caretakerai/agent';
import { config } from 'dotenv';

config();

async function main() {
  // Load markdown documents from the docs directory
  const loader = new DirectoryLoader(resolve(__dirname, 'docs'), {
    '.md': (path) => new TextLoader(path)
  });

  let documents = await loader.load();

  // Split documents into chunks about 300 words each
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1500 });
  documents = await splitter.splitDocuments(documents);

  const conn = driver(
    process.env.NEO4J_URI!,
    auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
  );

  const session = conn.session();

  try {
    // Create all vector indices
    await session.run(
      /* cypher */ `
        CREATE VECTOR INDEX passages IF NOT EXISTS
        FOR (p:Passage) ON (p.embedding)
        OPTIONS {indexConfig: { \`vector.dimensions\`: 512, \`vector.similarity_function\`: 'COSINE' }}
      `
    );

    await session.run(
      /* cypher */ `
        CREATE VECTOR INDEX tags IF NOT EXISTS
        FOR (t:Tag) ON (t.embedding)
        OPTIONS {indexConfig: { \`vector.dimensions\`: 512, \`vector.similarity_function\`: 'COSINE' }}
      `
    );

    await session.run(
      /* cypher */ `
        CREATE VECTOR INDEX notes IF NOT EXISTS
        FOR (n:Note) ON (n.embedding)
        OPTIONS {indexConfig: { \`vector.dimensions\`: 512, \`vector.similarity_function\`: 'COSINE' }}
      `
    );
  } finally {
    await session.close();
  }

  // Process each document
  for (const doc of documents) {
    await new Promise(r => setTimeout(r, 5000)); // To not hit the quote limits

    try {
      await extract(doc);
    } catch (err) {
      if (err instanceof AgentRetryError) {
        continue;
      }

      throw err;
    }
  }
}

main();