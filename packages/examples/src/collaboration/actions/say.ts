import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';
import chalk from 'chalk';
import inputPrompt from '@inquirer/input';

export class Say extends Action {
  readonly exit = false;
  readonly kind = Say.name;
  readonly description = 'Use this function to relay information to the user.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
        //Observation 1// The user says: tell me a joke
        //Thought 1// The user wants to hear a joke, possibly to lighten the mood or for entertainment. I need to respond with a light-hearted and appropriate joke.
        //Action 1// Say
        Sure, here's one for you: Why don't scientists trust atoms? Because they make up everything!
      `.trim())
    }
  ];

  async execute({ input, agent }: ActionInput) {
    console.log(`${chalk.bold(`${agent.name}:`)} ${input}`);

    const reply = await inputPrompt({
      message: 'Human:'
    });

    return `The user says: ${reply}`;
  }
}