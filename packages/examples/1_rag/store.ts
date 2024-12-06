import { resolve } from 'path';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';

export const fromDocuments = async () => {
  const loader = new DirectoryLoader(resolve(process.cwd(), '1_rag/docs'), {
    '.pdf': (path) => new PDFLoader(path)
  });

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 100
  });

  const documents = await loader.load();
  const passages = await splitter.splitDocuments(documents);
  const store = await FaissStore.fromDocuments(passages, new OpenAIEmbeddings());
  await store.save(resolve(process.cwd(), '1_rag/docs'));
  return store;
};

export const fromExistingIndex = async () => {
  const store = await FaissStore.load('1_rag/docs', new OpenAIEmbeddings());
  return store;
}