import { resolve } from 'path';
import { Document } from 'langchain/document';
import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { OpenAIEmbeddings } from '@langchain/openai';

export const save = async (storeName: string, documents: Document[]) => {
  let store: FaissStore;

  try {
    store = await FaissStore.load(`3_zettelkasten/stores/${storeName}`, new OpenAIEmbeddings());
  } catch {
    store = await FaissStore.fromDocuments([], new OpenAIEmbeddings());
  }

  await store.addDocuments(documents);
  await store.save(resolve(process.cwd(), `3_zettelkasten/stores/${storeName}`));
  return store;
};

export const load = async (storeName: string) => {
  const store = await FaissStore.load(`3_zettelkasten/stores/${storeName}`, new OpenAIEmbeddings());
  store.similaritySearch('', 5, )
  return store;
}