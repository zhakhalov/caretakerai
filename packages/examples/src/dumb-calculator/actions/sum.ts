import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';
import chalk from 'chalk';
import inputPrompt from '@inquirer/input';

export class Sum extends Action {
  readonly exit = false;
  readonly kind = Sum.name;
  readonly description = 'Sum the numbers and provided in you with the result.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
        <observation>
        The user provided numbers for summation: 15, 5, 17
        </observation>
        <thought>
        Considering the provided inputs the most suitable action is summation. I proceed to compute the sum of the numbers by using the Sum action.
        </thought>
        <action kind="Sum">
        [15, 5, 7]
        </action>
        <observation>
        27
        </observation>
      `.trim())
    }
  ];

  async execute({ input }: ActionInput) {
    try {
        const numbers: number[] = JSON.parse(input);
        return numbers.reduce((acc, n) => acc + n, 0).toString();
    } catch (e) {
        const err = e as Error;
        return err.message;
    }
  }
}