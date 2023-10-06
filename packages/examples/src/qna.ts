import dedent from 'dedent';
import { OpenAI } from 'langchain/llms/openai';
import { Lookup } from '@or-sdk/lookup';
import { Agent, Action, ActionInput, Experience, ExperienceKind } from '@caretaker/agent';

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
    const searchResults = await this.lookup.search('asdasd', { query: input });

    return dedent`
      The search results revealed these possible answers, arranged by relevance:
      ${searchResults.map(({ content }) => content).join('\n[...]\n')}
    `.trim();
  }
}

class Say extends Action {
  readonly exit = true;
  readonly kind = 'Say';
  readonly description = 'Use this function to relay information to the user.';

  async execute({ input }: ActionInput) {
    return input;
  }
}

const lookup = new Lookup({
  token: ''
});

const llm = new OpenAI({

});

const agent = new Agent({
  llm,
  actions: [
    new Search(lookup),
    new Say(),
  ],
  instruction: dedent`
    As an AI language assistant, you are set to assist users by fetching answers to their questions from our knowledge base.
    Please remember the following:
    - A maximum of seven search attempts are allowed before offering any output to the users.
    - Your responses should be based solely on the information you retrieved from the knowledge base.
    - Note that search results are not visible to the user.
    - Please refrain from fabricating answers if the necessary information is missing.
  `.trim(),
  experience: [],
  example: await Agent.parseExperience(dedent`
    Observation 1: The user says: How long does egg boiling take?
    ***
    Thought 1: The user wants to know the approximate time it will take to boil an egg. I will need to search the database to find this information.
    ***
    Action 1: Search
    The time needed to boil an egg
    ***
    Observation 2: The search results revealed these possible answers, arranged by relevance:
    A slightly set yolk and set white take around 4 minutes. A medium-cooked, firmer yolk and set white need about 5 minutes. Hard-boiled eggs with lightly soft yolks will take about 6 minutes. Firmly hard-boiled eggs demand around 8 minutes.
    [...]
    A classic, mashable hard-boiled egg that is not too dry or chalky takes a specific amount of cooking time. You'll learn how to boil eggs perfectly...
    [...]
    Typically, eggs are boiled for seven minutes, but you could vary the duration depending on your preference. The objective is to help...
    ***
    Thought 2: The search detailed the varying amounts of time necessary for cooking eggs to different consistencies. However, it's not apparent what consistency the user is looking for, so I'll need to get more information from the user.
    ***
    Action 2: Say
    Could you specify your preferred consistency for the egg yolk: medium, firm, or lightly soft?
    ***
    Observation 3: The user says: I prefer a soft yolk.
    ***
    Thought 3: Now that the user has specified their preference for a soft yolk, I can provide the exact boiling time based on the information retrieved from the search results.
    ***
    Action 3: Say
    For a slightly soft yolk, hard-boil your egg for around 6 minutes. Do you require any further assistance?
    ***
    Observation 4: The user says: No, thank you. That's all I needed to know.
    ***
    Thought 4: The user seems satisfied with the information provided and does not require further assistance. No additional information retrieval is needed at this point.
    ***
    Action 4: Say
    I'm glad I could help! If you have any more questions in the future, feel free to ask. Have a great day!
  `)
  ,
});

agent.invoke();