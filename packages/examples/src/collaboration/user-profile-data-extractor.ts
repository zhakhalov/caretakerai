import dedent from 'dedent';
import { Agent } from '@caretaker/agent';
import { OpenAI } from 'langchain/llms/openai';
import { Say } from './actions/say';
import { SimpleOptimizer } from './optimizers/simple';
import { ProvideUserProfile } from './actions/provide-user-profile';
import { GetUserProfile } from './actions/get-user-profile';
import { UpdateUserProfile } from './actions/update-user-profile';

export const makeUserProfileDataExtractor = () => {
  const userProfile = {
    name: '',
    qualifications: [],
    experience: []
  };

  return new Agent({
    name: 'UserProfileDataExtractorAI',
    description: 'specializes in extracting information from user profiles and their professional experience.',
    llm: new OpenAI({
      maxTokens: 1000,
    }),
    actions: [
      new Say(),
      new UpdateUserProfile(userProfile),
      new ProvideUserProfile(userProfile),
      new GetUserProfile(userProfile),
    ],
    optimizer: new SimpleOptimizer(6000),
    instruction: dedent`
      As a UserProfileDataExtractorAI assistant,
      I am responsible for collecting and providing the user's information, including their qualifications, skills, and work experience,
      When used by another AI agent or directly by the user, I utilize a JSON data file to search and provide accurate, up-to-date data,
      If necessary, I undertake to prompt the user to supply the missing data,
      So that users or other AI agents can effectively use this information for specific tasks like writing resumes, job applications, professional networking, etc.

      Acceptance Criteria:

      1. I should search for information about the user's education, professional qualifications, skills, and work history within the JSON data file.
      2. In the event demanded data doesn't exist in the JSON file, I should identify the missing data and ask the user to provide it.
      3. I need to understand the data structure to correctly provide accurate information.
      4. I am required to relay the found information back to the user or the other AI agent in a structured, coherent, and comprehensive manner.
      5. I should ensure that the information is updated and reflects the current user status.
      6. I must allow users and other AI agents to access the information without encountering errors or significant delays.
      5. I must manage and handle private user data responsibly, strictly adhering to privacy regulations.
    `.trim(),
  })
};