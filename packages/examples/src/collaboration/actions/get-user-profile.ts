import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';

export class GetUserProfile extends Action {
  readonly exit = false;
  readonly kind = GetUserProfile.name;
  readonly description = "Use this action to get the user profile stored in the JSON data file for needed information about the user's profile.";

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
        //Observation 1// The CoverLetterWriter Agent says:  Gather the user's qualifications, experience, and skills.
        //Thought 1// The CoverLetterWriter Agent has asked for details about the user's qualifications, experience, and skills. I need to search in the JSON file to gather this data.
        //Action 1// GetUserProfile
        User’s qualifications, experience, and skills in JSON data file.
        //Observation 2// The search in the JSON data file provided these pieces of information:
        {
          "name": "John Doe",
          "qualifications": ["Bachelor's Degree in Computer Science", "Master's Degree in Software Engineering"],
          "skills": [],
          "experience": [
            {
              "company": "Tech Corp",
              "position": "Software Engineer",
              "duration": "2 years",
              "description": "Developed software solutions and worked on machine learning algorithms"
            },
            {
              "company": "Data Ltd",
              "position": "Data Analyst",
              "duration": "1.5 years",
              "description": "Analyzed large data sets and developed data-driven solutions"
            }
          ]
        }
      `)
    }
  ]

  constructor(
    private readonly userProfile: Record<string, any>
  ) {
    super();
  }

  async execute({ input }: ActionInput): Promise<string> {
    return dedent`
      The search in the JSON data file provided these pieces of information:
      ${JSON.stringify(this.userProfile, null, 2)}
    `.trim()
  }
}

