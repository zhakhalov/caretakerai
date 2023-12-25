import { resolve } from 'path';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

export const createStore = async () => {
    const loader = new DirectoryLoader(resolve(process.cwd(), 'qna/docs'), {
        '.pdf': (path) => new PDFLoader(path)
    });

    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 100
    });

    const documents = await loader.loadAndSplit(splitter);
    const store = await MemoryVectorStore.fromDocuments(documents, new OpenAIEmbeddings());
    return store;
}