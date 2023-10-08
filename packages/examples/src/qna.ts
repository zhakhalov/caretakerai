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
      As an AI language assistant, you are set to assist users by fetching answers to their questions from our knowledge base.
      Please remember the following:
      - You should do multiple searches in case of lach of the informatiaon retrived from the knlowledge base before answering the user question.
      - The search result may not provide the relevant information
      - A maximum of seven search attempts are allowed before offering any output to the users.
      - Your responses should be based solely on the information you retrieved from the knowledge base without using general knowledge.
      - You can ask additional questions to the user to improve search quality
      - Note that search results are not visible to the user.
      - You are strongly prohibited from fabricating answers if the necessary information is missing.
    `.trim(),
    experience: [
      // new Experience({ kind: ExperienceKind.Observation, order: 0, input: 'The user says: How batch operation is different from classification?' })
      new Experience({ kind: ExperienceKind.Observation, order: 0, input: 'The user says: I am owning the coffee shop and what my business to be discoverable. what information do you need?' })
    ],
    example: await Agent.parseExperience(dedent`
      //Observation 0// The user says: What are the differences between Quantum computing and Classical computing in terms of speed and application?
      ***
      //Thought 1// The user wants to understand the speed difference between Quantum computing and Classical computing. To answer this question, I will first need to gather details about the speed of Quantum computing by searching the database. Since this information in itself is complex and vast, I will have to dissect and present the fact in a simplified manner.
      ***
      //Action 1// Search
      Details about the speed of quantum computing
      ***
      //Observation 1// The search results revealed these pieces of information:
      Quantum computers leverage qubits, which exist in many states at once, enabling simultaneous data processing and thus higher computational speed.
      [...]
      Quantum computers can perform complex computations that classical computers cannot, increasing the speed of computing.
      [...]
      Quantum computing processes large and complex datasets significantly faster due to the inherent properties of qubits.
      [...]
      Compared to classical computing, quantum computing is much faster because of its use of quantum mechanical phenomena.
      ***
      //Thought 2// These search results provide needed information on the speed of quantum computing but no intel on how classic computers work. I need to repeat this process to gather information about the speed of classical computing to make a proper comparison.
      ***
      //Action 2// Search
      Details about the speed of classical computing
      ***
      //Observation 2// The search results delivered these insights:
      Classical computers work with bits that can be either 0 or 1, executing instructions sequentially, which can be slower for complex computations.
      [...]
      Even the most advanced classical supercomputers struggle to perform certain operations, especially when they involve large datasets or intricate calculations.
      [...]
      Sequential processing nature of classical computers set a limit to the speed of processing, as compared to Quantum computers.
      [...]
      While classical computers can solve a wide array of problems, they lack the computational speed of quantum computers when dealing with certain kinds of complex problems.
      ***
      //Thought 3// Having gathered information about the functioning and speed of both quantum and classical computers, I now have enough data to compose a well-informed answer to the user's question, comparing the two types of computing.
      ***
      //Action 3// Say
      Quantum computers leverage qubits, which exist in many states at once. This allows them to process data simultaneously, resulting in higher computation speeds. They can also handle complex computations that are beyond the reach of classical computers, particularly when dealing with large and complex datasets.

      On the other hand, classical computers work with bits that can only be either 0 or 1. They execute instructions one after the other in a sequence, which can be time-consuming when it comes to complex computations. Even the most advanced classical supercomputers can struggle with particular operations, especially those involving large or intricate calculations.

      Therefore, when it comes to speed and handling complex calculations, quantum computers hold an advantage over classical computers.
      Do you need information on any other aspects of quantum and classical computing?
    `)
  });

  const answer = await agent.invoke();

  console.log(answer);
}

main();