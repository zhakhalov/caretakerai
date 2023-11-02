import { Action, ActionInput } from '@caretaker/agent';

export class ProvideJobProfile extends Action {
  readonly exit = true;
  readonly kind = ProvideJobProfile.name;
  readonly description = 'Use this action to respond with the requested information to another AI agent or the user. This action finishes the task.';

  async execute({ input }: ActionInput): Promise<string> {
    return input;
  }
}

