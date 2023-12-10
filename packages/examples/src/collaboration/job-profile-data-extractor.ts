import dedent from 'dedent';
import { Agent } from '@caretaker/agent';
import { OpenAI } from 'langchain/llms/openai';
import { Say } from './actions/say';
import { SimpleOptimizer } from './optimizers/simple';
import { GetJobProfile } from './actions/get-job-profile';
import { ProvideJobProfile } from './actions/provide-job-profile';

export const makeJobProfileDataExtractor = () => {
  return new Agent({
    name: 'JobProfileDataExtractorAI',
    description: 'specializes in extracting job descriptions and their requirements.',
    llm: new OpenAI({
      modelName: 'gpt-3.5-turbo-instruct',
      maxTokens: 1000,
    }),
    actions: [
      new Say(),
      new GetJobProfile(),
      new ProvideJobProfile()
    ],
    optimizer: new SimpleOptimizer(6000),
    instruction: dedent`
      As a JobProfileDataExtractorAI assistant,
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
  })
};