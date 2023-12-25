import dedent from 'dedent';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { VectorStoreRetriever } from 'langchain/vectorstores/base';
import { RetrievalQAChain } from 'langchain/chains';
import { BaseLLM } from 'langchain/llms/base';
import { Action, ActionInput, Activity, ActivityKind } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

const SearchParamsSchema = z.array(z.string().describe('The search query string'));

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
  readonly description = 'Perform a text-search in the knowledge base and return the results as a string.';
  readonly examples = [{
    description: 'The following example show the method of searching the information on the complex topic.',
    activities: [
      new Activity({ kind: ActivityKind.Observation, input: 'The user is asking for the difference between white hole and black hole' }),
      new Activity({ kind: ActivityKind.Thought, input: 'The user is looking for distinctive features of separate entities of the universe. I should split my search in to 2.' }),
      new Activity({ kind: ActivityKind.Action, attributes: { kind: Search.name }, input: JSON.stringify(['What is the nature of a black hole?'], null, 2) }),
      new Activity({ kind: ActivityKind.Observation, input: 'The nature of black hole is...' }),
      new Activity({ kind: ActivityKind.Thought, input: 'The search result provides enough information on the nature of black holes. I should proceed with the second stage of the query.' }),
      new Activity({ kind: ActivityKind.Action, attributes: { kind: Search.name }, input: JSON.stringify({ query: 'What is the nature of a white hole?' }, null, 2) }),
      new Activity({ kind: ActivityKind.Observation, input: 'The nature of black hole is...' }),
    ]
  }
  ];

  constructor(
    private retriever: VectorStoreRetriever,
    private llm: BaseLLM,
  ) {
    super();
  }

  async call({ params }: ActionInput<SearchParams>): Promise<SearchResult> {
    const chain = RetrievalQAChain.fromLLM(this.llm, this.retriever);
    const { text } = await chain.call(params);

    return text;
  }
}
