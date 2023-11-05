import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';

export class ProvideUserProfile extends Action {
  readonly exit = true;
  readonly kind = ProvideUserProfile.name;
  readonly description = 'Use this action to respond with the requested information to another AI agent or the user. This action finishes the task.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
      //Action 1// Say
      Thank you, John. I've updated your skills in my database. Here's what I have now:
      Writing: JavaScript
      Frameworks: Django, React
      Programming Language: Python
      Can you confirm if these details are correct?
      ***
      //Observation 2// The User says: Yes, that's correct.
      ***
      //Thought 2// The user confirmed the accuracy of the updated skills data. I should now provide this information, along with the other user details.
      ***
      //Action 2// ProvideUserProfile
      {
        "name": "John Doe",
        "qualifications": ["Bachelor's Degree in Computer Science", "Master's Degree in Software Engineering"],
        "skills": ["JavaScript", "Python", "Django", "React"],
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
  ];

  constructor(
    private readonly userProfile: Record<string, any>
  ) {
    super();
  }

  async execute({ input }: ActionInput): Promise<string> {
    return input;
  }
}

