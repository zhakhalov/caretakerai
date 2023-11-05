import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';

export class ProvideJobProfile extends Action {
  readonly exit = true;
  readonly kind = ProvideJobProfile.name;
  readonly description = 'Use this action to respond with the requested information to another AI agent or the user. This action finishes the task.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
      //Observation 1// The search in the job description resource delivered these insights:
      {
        "position":"Senior Software Developer",
        "company":"XYZ corporation",
        "description":"We are seeking an experienced software developer with a strong background in software development and a passion for technology. The primary focus will be to create sophisticated software solutions to meet the evolving needs of our business and our clients.",
        "requirements":[
          "Minimum 5+ years of software development experience",
          "Experience with JavaScript, Python, C++",
          "Experience with web development frameworks like React and Django is preferred",
          "Bachelor's or Master's in Computer Science or related field",
          "Proven experience in managing a team of developers",
          "Excellent problem-solving skills, communication skills, and a team player"
        ]
      }
      ***
      //Thought 1// From the search, I have found the job description and requirements for the Senior Software Developer position at XYZ corporation. The information found is sufficient to fulfill the request. Now I should provide this information to the querying agent.
      ***
      //Action 1// ProvideJobProfile
      {
        "position":"Senior Software Developer",
        "company":"XYZ corporation",
        "description":"We are seeking an experienced software developer with a strong background in software development and a passion for technology. The primary focus will be to create sophisticated software solutions to meet the evolving needs of our business and our clients.",
        "requirements":[
          "Minimum 5+ years of software development experience",
          "Experience with JavaScript, Python, C++",
          "Experience with web development frameworks like React and Django is preferred",
          "Bachelor's or Master's in Computer Science or related field",
          "Proven experience in managing a team of developers",
          "Excellent problem-solving skills, communication skills, and a team player"
        ]
      }
      `)
    }
  ]

  async execute({ input }: ActionInput): Promise<string> {
    return input;
  }
}

