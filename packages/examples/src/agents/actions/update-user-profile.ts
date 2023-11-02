import { Action, ActionInput } from '@caretaker/agent';

export class UpdateUserProfile extends Action {
  readonly exit = false;
  readonly kind = UpdateUserProfile.name;
  readonly description = 'Use this action to update user profile.';

  constructor(
    private readonly userProfile: Record<string, any>
  ) {
    super();
  }

  async execute({ input }: ActionInput) {
    Object.assign(this.userProfile, JSON.parse(input));
    return 'Profile updated!'
  }
}