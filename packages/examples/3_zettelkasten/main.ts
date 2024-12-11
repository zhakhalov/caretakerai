import { resolve, sep } from 'path';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { extract } from './agents/extractor';
import { config } from 'dotenv';

config();

async function main() {
  // Load markdown documents from the docs directory
  const loader = new DirectoryLoader(resolve(__dirname, 'docs'), {
    '.md': (path) => new TextLoader(path)
  });

  const documents = await loader.load();

  // Process each document
  for (const { pageContent, metadata: { source } } of documents) {
    await extract({
      document: pageContent,
      documentName: source.split(sep).at(-1),
    });
  }
}

main();