import dedent from 'dedent';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { VectorStoreRetriever } from 'langchain/vectorstores/base';
import { RetrievalQAChain } from 'langchain/chains';
import { BaseLLM } from 'langchain/llms/base';
import { Action, ActionInput, Activity, ActivityKind } from '@caretaker/agent';

const SearchParamsSchema = z.array(z.string()).describe('The search queries');
type SearchParams = z.infer<typeof SearchParamsSchema>;
const SearchParamsJsonSchema = zodToJsonSchema(SearchParamsSchema, 'SearchParamsSchema')
  .definitions!.SearchParamsSchema as any;

const SearchResultSchema = z.string().describe('The search results for each input query');
type SearchResult = z.infer<typeof SearchResultSchema>;
const SearchResultJsonSchema = zodToJsonSchema(SearchResultSchema, 'SearchResultSchema')
  .definitions!.SearchResultSchema as any;

export class Search extends Action<SearchParams, SearchResult> {
  readonly params = SearchParamsJsonSchema;
  readonly result = SearchResultJsonSchema;
  readonly exit = false;
  readonly kind = Search.name;
  readonly description = 'Perform text-searches in the knowledge base and return the results as strings.';
  readonly examples = [{
    description: 'The following example shows the method of searching for information on complex topics.',
    activities: [
      new Activity({ kind: ActivityKind.Observation, input: 'The user is asking for the difference between a white hole and a black hole' }),
      new Activity({ kind: ActivityKind.Thought, input: 'The user is looking for distinctive features of separate entities of the universe. I should split my search into 2.' }),
      new Activity({ kind: ActivityKind.Action, attributes: { kind: Search.name }, input: JSON.stringify(['What is the nature of a black hole?', 'What is the nature of a white hole?'], null, 2) }),
      new Activity({
        kind: ActivityKind.Observation,
        input: dedent`
          Query: What is the nature of a black hole?
          Result: The nature of a black hole is...

          Query: What is the nature of a white hole?
          Result: The nature of a white hole is...
        `.trim()
      }),
    ]
  }]

  constructor(
    private retriever: VectorStoreRetriever,
    private llm: BaseLLM,
  ) {
    super();
  }

  async call({ params }: ActionInput<SearchParams>): Promise<SearchResult> {
    const chain = RetrievalQAChain.fromLLM(this.llm, this.retriever);
    const results = await Promise.all(params.map(query => chain.call({ query })));
    return params.map((query, index) => dedent`
      Query: ${query}
      Result: ${results[index].text}
    `.trim()).join('\n\n');
  }
}
