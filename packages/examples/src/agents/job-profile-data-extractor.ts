import dedent from 'dedent';
import { Agent } from '@caretaker/agent';
import { OpenAI } from 'langchain/llms/openai';
import { Say } from './actions/say';
import { SimpleOptimizer } from './optimizers/simple';
import { GetJobProfile } from './actions/get-job-profile';
import { ProvideJobProfile } from './actions/provide-job-profile';

export const makeJobProfileDataExtractor = () => {
  const userProfile = {
    name: '',
    qualifications: [],
    experience: []
  };

  return new Agent({
    name: 'JobProfileDataExtractor',
    description: 'specializes in extracting job descriptions and their requirements.',
    llm: new OpenAI({
      modelName: 'gpt-4',
      maxTokens: 1000,
    }),
    actions: [
      new Say(),
      new GetJobProfile(),
      new ProvideJobProfile()
    ],
    optimizer: new SimpleOptimizer(6000),
    instruction: dedent`
      As a JobProfileDataExtractor assistant,
      I need to collect and provide the job description and requirements for a given job position,
      When used by a user or another AI agent, I should accurately fetch this information from a specific resource,
      So that the users or other AI agents can effectively use this information for specific tasks such as writing cover letters, preparing for interviews, considering job applications, etc.

      Acceptance Criteria:

      1. I should provide information about the job description and its requirements when given a specific job position and a company name.
      2. The information provided should be detailed, accurate, and up-to-date.
      3. I should promptly notify the user or another AI agent if the requested job description is unavailable, unaccessible, or the provided information is not sufficient.
      4. If used by an AI agent, my response should be sufficient to fulfill the querying agent's request.
      5. If used by a user, the provided information should be comprehensive and easy to understand.
    `.trim(),
    example: Agent.parseActivities(dedent`
      //Observation 1// The Agent says: Obtain the job description and requirements for the Senior Software Developer position at XYZ corporation.
      ***
      //Thought 1// The Agent has requested the job description and requirements for the Senior Software Developer position at XYZ corporation. I need to search in the job description resource to gather this data.
      ***
      //Action 1// GetJobProfile
      Job description and requirements for the Senior Software Developer position at XYZ corporation.
      ***
      //Observation 2// The search in the job description resource delivered these insights:
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
      //Thought 2// From the search, I have found the job description and requirements for the Senior Software Developer position at XYZ corporation. The information found is sufficient to fulfill the request of the Agent. Now I should provide this information to the querying agent.
      ***
      //Action 2// ProvideJobProfile
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
    `.trim()),
  })
};