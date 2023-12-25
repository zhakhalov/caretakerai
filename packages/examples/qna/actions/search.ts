import dedent from 'dedent';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Action, ActionInput, Activity, ActivityKind } from '@caretaker/agent';
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
  readonly description = 'Perform a text-search in the knowledge base and return the results as a string. Each search should be as atomic as possible.';
  readonly examples = [{
    description: 'The following example show the method of finding the information to provide answer on complex questions',
    activities: [
      new Activity({ kind: ActivityKind.Observation, input: 'The user is asking for the difference between white hole and black hole' }),
      new Activity({ kind: ActivityKind.Thought, input: 'The user is looking for distinctive features of separate entities of the universe. I should split my search in to 2 stages.' }),
      new Activity({ kind: ActivityKind.Action, attributes: { kind: Search.name }, input: JSON.stringify({ query: 'What is black hole?' }, null, 2) }),
      new Activity({ kind: ActivityKind.Observation, input: 'Some finding on the nature of black hole...' }),
      new Activity({ kind: ActivityKind.Thought, input: 'The search result provides enough information on the nature of black holes. I should proceed with the second stage of the query.' }),
      new Activity({ kind: ActivityKind.Action, attributes: { kind: Search.name }, input: JSON.stringify({ query: 'What is white hole?' }, null, 2) }),
      new Activity({ kind: ActivityKind.Observation, input: 'Some finding on the nature of white hole...' }),

    ]
  }
  ];

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
