import dedent from 'dedent';
import { similarity } from 'ml-distance';
import { OpenAI } from 'openai';
import { Action, ActionInput, Agent } from '@caretaker/agent';

export class SearchAgent extends Action {
  readonly exit = false;
  readonly kind = SearchAgent.name;
  readonly description = 'Use this action to search for the agent to collaborate.';

  constructor(
    private readonly agents: Agent[]
  ) {
    super();
  }

  async execute({ input }: ActionInput) {
    const { data } = await new OpenAI().embeddings.create({
      model: 'text-embedding-ada-002',
      input: [input, ...this.agents.map(({ name, description }) => `${name} - ${description}`)]
    });

    const [inputEmbedding, ...embeddings] = data;

    const agentsWithEmbeddings = embeddings
      .map(({ embedding }, index) => ({
        ...this.agents[index],
        similarity: similarity.cosine(inputEmbedding.embedding, embedding)
      }))
      .sort(({ similarity: similarityA }, { similarity: similarityB }) => similarityB - similarityA);

    return dedent`
      The search results revealed these pieces of information:
      ${agentsWithEmbeddings.map(({ name, description }) => `${name} - ${description}`).join('\n[...]\n')}
    `.trim();
  }
}