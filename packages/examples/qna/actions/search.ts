import dedent from 'dedent';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { BaseRetriever } from '@langchain/core/retrievers';
import { RetrievalQAChain } from 'langchain/chains';
import { BaseLanguageModel } from '@langchain/core/language_models/base';
import { Action, ActionInput, Activity, ActivityKind } from '@caretaker/agent';

const SearchParamsSchema = z.object({
  queries: z.array(z.string()).describe('The search queries'),
}).describe('Parameters for search');

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
      new Activity({ kind: ActivityKind.Action, attributes: { kind: Search.name }, input: JSON.stringify({ queries: ['What is the nature of a black hole?', 'What is the nature of a white hole?']}, null, 2) }),
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
    private retriever: BaseRetriever,
    private llm: BaseLanguageModel,
  ) {
    super();
  }

  async call({ params: { queries } }: ActionInput<SearchParams>): Promise<SearchResult> {
    const chain = RetrievalQAChain.fromLLM(this.llm, this.retriever);
    const results = await Promise.all(queries.map(query => chain.call({ query })));
    return queries.map((query, index) => dedent`
      Query: ${query}
      Result: ${results[index].text}
    `.trim()).join('\n\n');
  }
}
