
import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';

export class UpdateUserProfile extends Action {
  readonly exit = false;
  readonly kind = UpdateUserProfile.name;
  readonly description = 'Use this action to update user profile.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
        //Observation 1// The User says: Update my profile with my new job role as Senior Software Developer at XYZ Corporation.
        //Thought 1// The user wants to update their job role in their profile. I can use the UpdateUserProfile action to carry out this update.
        //Action 1// UpdateUserProfile
        {
          "current_job_role": "Senior Software Developer",
          "current_company": "XYZ Corporation"
        }
        //Observation 2// The user's profile has been updated.
      `)
    }
  ];

  constructor(
    private readonly userProfile: Record<string, any>
  ) {
    super();
  }

  async execute({ input }: ActionInput) {
    Object.assign(this.userProfile, JSON.parse(input));
    return `The user's profile has been updated`;
  }
}