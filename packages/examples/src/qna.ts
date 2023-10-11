import dedent from 'dedent';
import { OpenAI } from 'langchain/llms/openai';
import { Lookup } from '@or-sdk/lookup';
import inputPrompt from '@inquirer/input';
import chalk from 'chalk';
import { Agent, Action, ActionInput, Experience, ExperienceKind } from '@caretaker/agent';
import dontenv from 'dotenv';

dontenv.config();

class Search extends Action {
  readonly exit = false;
  readonly kind = 'Search';
  readonly description = 'This function enables you to search the database for information. You must provide input for this action. The search results are not visible to the user.';

  constructor(
    private readonly lookup: Lookup
  ) {
    super();
  }

  async execute({ input }: ActionInput) {
    const searchResults = await this.lookup.search('7bbaeb9e-79b7-4b5e-a40d-963b01469256', { query: input, maxDistance: 0.25 });

    const reply = searchResults.length ? dedent`
      The search results revealed these possible answers, arranged by relevance:
      ${searchResults.map(({ content }) => content).join('\n[...]\n')}
    `.trim() : 'No relevant search results';

    return reply
  }
}

class Say extends Action {
  readonly exit = false;
  readonly kind = 'Say';
  readonly description = 'Use this function to relay information to the user.';

  async execute({ input }: ActionInput) {
    console.log(`${chalk.bold('AI:')} ${input}`);

    const reply = await inputPrompt({
      message: 'Human:'
    });

    return `The user says: ${reply}`;
  }
}

async function main() {
  const lookup = new Lookup({
    token: process.env.OR_TOKEN!,
    serviceUrl: process.env.LOOKUP_API_URL!,
  });

  const llm = new OpenAI();

  const agent = new Agent({
    llm,
    actions: [
      new Search(lookup),
      new Say(),
    ],
    instruction: dedent`
      As an AI language assistant, you are set to assist users by fetching answers to their questions from our knowledge base using full-text-search interface.

      Please remember the following:
      1. Base responses solely on available context information.
      2. Conduct multiple searches in knowledge base when information is unclear or lacking.
      3. Restructure the search term if results are inadequate.
      4. Perform a maximum of seven searches before providing user output.
      5. If the user's query isn't clear enough, ask additional questions.
      6. Keep in mind that search results aren't visible to the user.
      7. Refrain from creating answers if necessary information is missing; opt for extra searches.
    `.trim(),
    experience: [
      // new Experience({ kind: ExperienceKind.Observation, order: 0, input: 'The user says: How batch operation is different from classification?' })
      new Experience({ kind: ExperienceKind.Observation, order: 4, input: 'The user says: What is the difference between batching and classification?' })
    ],
    example: await Agent.parseExperience(dedent`
      //Observation 1// The user says: What are the differences between Quantum computing and Classical computing in terms of speed and application?
      ***
      //Thought 1// Considering the complexity of the user's question about the speed and application differences between Quantum and Classical computing and the lack of specific information in the context, I need to break down the question and search the knowledge base step by step starting with the speed of quantum computing.
      ***
      //Action 1// Search
      Speed characteristics of quantum computing.
      ***
      //Observation 2// The search results revealed these pieces of information:
      Quantum computers leverage qubits, which exist in many states at once, enabling simultaneous data processing and thus higher computational speed.
      [...]
      Quantum computers can perform complex computations that classical computers cannot, increasing the speed of computing.
      [...]
      Quantum computing processes large and complex datasets significantly faster due to the inherent properties of qubits.
      [...]
      Compared to classical computing, quantum computing is much faster because of its use of quantum mechanical phenomena.
      ***
      //Thought 2// Although the search results have provided useful insights about the speed of quantum computing, the context still lacks information about the speed of classical computing. For a comprehensive comparison, I need to search the database for details about the speed of classical computing.
      ***
      //Action 2// Search
      Speed characteristics of classical computing.
      ***
      //Observation 3// The search results delivered these insights:
      Classical computers work with bits that can be either 0 or 1, executing instructions sequentially, which can be slower for complex computations.
      [...]
      Even the most advanced classical supercomputers struggle to perform certain operations, especially when they involve large datasets or intricate calculations.
      [...]
      Sequential processing nature of classical computers set a limit to the speed of processing, as compared to Quantum computers.
      [...]
      While classical computers can solve a wide array of problems, they lack the computational speed of quantum computers when dealing with certain kinds of complex problems.
      ***
      //Thought 3// Having the information about the functioning and speed of both quantum and classical computers in the context, I now have enough data to compose a well-informed answer to the user's question, comparing the two types of computing.
      ***
      //Action 3// Say
      Quantum computers, using qubits that exist in multiple states simultaneously, outperform classical computers in speed and complexity of calculations. This is due to their ability to process data concurrently, tackling large and intricate computations more effectively. Conversely, classical computers, using bits that are either 0 or 1, carry out computations sequentially, which can be slower and challenging for large or complex computations.
    `)
  });

  const answer = await agent.invoke();

  console.log(answer);
}

main();