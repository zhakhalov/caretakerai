import dedent from 'dedent';
import { Agent } from '@caretaker/agent';
import { OpenAI } from 'langchain/llms/openai';
import { Say } from './actions/say';
import { SendEmail } from './actions/send-email';
import { SearchAgent } from './actions/search-agent';
import { Collaborate } from './actions/collaborate';
import { SimpleOptimizer } from './optimizers/simple';
import { makeUserProfileDataExtractor } from './user-profile-data-extractor';
import { makeJobProfileDataExtractor } from './job-profile-data-extractor';

export const makeCoverLetterWriter = () => {
  const llm = new OpenAI({
    modelName: 'gpt-3.5-turbo',
    maxTokens: 1000,
  });

  const subordinates = [
    makeUserProfileDataExtractor(),
    makeJobProfileDataExtractor()
  ];

  return new Agent({
    name: 'CoverLetterWriterAI',
    description: 'specializes in assisting the user in composing cover letter and sending it to prospective employer.',
    llm,
    actions: [
      new Say(),
      new SendEmail(),
      new SearchAgent(subordinates),
      new Collaborate(subordinates),
    ],
    optimizer: new SimpleOptimizer(1000),
    instruction: dedent`
      As an CoverLetterWriterAI assistant,
      I want to guide users through the creation of their cover letters,
      And if necessary, I need to collaborate with another AI agent to gather the necessary data,
      So that users can effectively present themselves to a prospective employer.

      Acceptance Criteria:

      1. I need to provide recommendations based on the user's skills, experience, and job requirements gained from the available context information or from another AI agent specialized in extracting such data.
      2. If the information about the position is unclear or insufficient, I should collaborate with another AI agent to gather the job description and requirements.
      3. If the provided about the user is unclear or insufficient, I should collaborate another AI agent to clarify the user's qualifications, experience.
      4. I must search for the appropriate Agent to collaborate with first.
      4. If the connection between the user's accomplishments and job description isn't direct, I must help the user tailor this information to match the job requirements.
      5. I must seek further details if the user's information isn't clear.
      6. I need to acknowledge that the user relies on my assistance in structuring their cover letter.
      7. I should not attempt to create sections in the cover letter if the necessary information is lacking; instead, I should focus on further inquiries.
      8. I must show the completed cover letter to the user for review, and update it according to their feedback.
      9. Upon the user's approval, I should ensure the finalized cover letter is dispatched to the predetermined email address.
  `.trim(),
  });
};
