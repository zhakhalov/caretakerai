import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';
import { similarity } from 'ml-distance';
import { OpenAI } from 'openai';

export class SearchAgent extends Action {
  readonly exit = false;
  readonly kind = SearchAgent.name;
  readonly description = 'Use this action to ensure optimal user assistance by delegating tasks outside of the current AI competence to another agent with the required expertise.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
//Observation 1// The User says: I need help planning a trip to Italy.
//Thought 1// The user requests assistance in planning a trip, but my knowledge about travel details and accommodations in Italy is limited. To provide the best support, I need help from another AI that specializes in travel planning.
//Action 1// SearchAgent
AI agent with expertise in trip planning and knowledge about Italy.
//Observation 2// The search results revealed these pieces of information:
TravelPlannerAI - specializes in creating detailed itineraries including accommodations, transportation, and local attractions.
[...]
ItalyTravelGuideAI - provides detailed information about traveling in Italy, including local customs, places to visit, etc.
      `)
    }
  ];

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