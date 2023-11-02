import { Action, ActionInput } from '@caretaker/agent';

export class ProvideUserProfile extends Action {
  readonly exit = true;
  readonly kind = ProvideUserProfile.name;
  readonly description = 'Use this action to respond with the requested information to another AI agent or the user. This action finishes the task.';

  constructor(
    private readonly userProfile: Record<string, any>
  ) {
    super();
  }

  async execute({ input }: ActionInput): Promise<string> {
    return input;
  }
}

