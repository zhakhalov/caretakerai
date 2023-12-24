import dedent from 'dedent';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Action, ActionInput } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';

const SearchParamsSchema = z.object({
  query: z.string().describe('The search query string')
});

type SearchParams = z.infer<typeof SearchParamsSchema>;

const SearchParamsJsonSchema = zodToJsonSchema(SearchParamsSchema, 'SearchParamsSchema')
  .definitions!.SearchParamsSchema as JSONSchema;

const SearchResultSchema = z.string().describe('The search result as a string');

type SearchResult = z.infer<typeof SearchResultSchema>;

const SearchResultJsonSchema = zodToJsonSchema(SearchResultSchema, 'SearchResultSchema')
  .definitions!.SearchResultSchema as JSONSchema;

export class Search extends Action<SearchParams, SearchResult> {
  readonly params = SearchParamsJsonSchema;
  readonly result = SearchResultJsonSchema;
  readonly exit = false;
  readonly kind = Search.name;
  readonly description = 'Perform a search and return the results as a string.';
  readonly examples = [];

  constructor(private store: MemoryVectorStore) {
    super();
  }

  async call({ params: { query } }: ActionInput<SearchParams>): Promise<SearchResult> {
    const documents = await this.store.similaritySearch(query, 5);
    const resultsString = documents.map(doc => doc.pageContent).join('\n\n---\n\n');

    return dedent`
      Search results in order of relevance:
      ${resultsString}
    `.trim();
  }
}
