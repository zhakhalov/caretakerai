import dedent from 'dedent';
import { Action, ActionInput } from '@caretaker/agent';

export class GetUserProfile extends Action {
  readonly exit = false;
  readonly kind = GetUserProfile.name;
  readonly description = "Use this action to get the user profile stored in the JSON data file for needed information about the user's profile.";

  constructor(
    private readonly userProfile: Record<string, any>
  ) {
    super();
  }

  async execute({ input }: ActionInput): Promise<string> {
    return dedent`
      The actual user profile:
      \`\`\`
      ${JSON.stringify(this.userProfile, null, 2)}
      \`\`\`
    `.trim()
  }
}

