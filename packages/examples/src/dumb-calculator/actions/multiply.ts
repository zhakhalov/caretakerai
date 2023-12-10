import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';

export class Multiply extends Action {
  readonly exit = false;
  readonly kind = Multiply.name;
  readonly description = 'Multiply the numbers and provide you with the result.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
        <observation>
        The user provided numbers to multiply: 15, 5, 17
        </observation>
        <thought>
        Considering the provided inputs the most suitable action is multiplication. I proceed to compute the multiplication of the numbers by using the Multiply action.
        </thought>
        <action kind="Multiply">
        [15, 5, 7]
        </action>
        <observation>
        525
        </observation>
      `.trim())
    }
  ];

  async execute({ input }: ActionInput) {
    try {
        const numbers: number[] = JSON.parse(input);
        return numbers.reduce((acc, n) => acc * n, 1).toString();
    } catch (e) {
        const err = e as Error;
        return err.message;
    }
  }
}