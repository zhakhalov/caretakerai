import { Action, ActionInput } from '@caretaker/agent';
import chalk from 'chalk';
import inputPrompt from '@inquirer/input';

export class Say extends Action {
  readonly exit = false;
  readonly kind = Say.name;
  readonly description = 'Use this function to relay information to the user.';

  async execute({ input, agent }: ActionInput) {
    console.log(`${chalk.bold(`${agent.name}:`)} ${input}`);

    const reply = await inputPrompt({
      message: 'Human:'
    });

    return `The user says: ${reply}`;
  }
}