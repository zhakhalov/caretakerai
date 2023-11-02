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
    name: 'UserProfileDataExtractor',
    description: 'specializes in extracting information from user profiles and their professional experience.',
    llm: new OpenAI({
      modelName: 'gpt-4',
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
      As a UserProfileDataExtractor assistant,
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
    example: Agent.parseActivities(dedent`
      //Observation 1// The CoverLetterWriter Agent says:  Gather the user's qualifications, experience, and skills.
      ***
      //Thought 1// The CoverLetterWriter Agent has asked for details about the user's qualifications, experience, and skills. I need to search in the JSON file to gather this data.
      ***
      //Action 1// GetUserProfile
      User’s qualifications, experience, and skills in JSON data file.
      ***
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
      ***
      //Thought 2// I found the user's name, qualifications, and experience. However, the user's skills are missing from the JSON data. As per my Acceptance Criteria, I need to ask the user to provide the missing data.
      ***
      //Action 2// Say
      John, I couldn't locate information on your technical skills in my database. Could you please share your skills with me?
      ***
      //Observation 3// The User says: Yes, I'm proficient in JavaScript, Python, and I have experience with Django and React frameworks.
      ***
      //Thought 3// The user provided details about their technical skills. I should now update these details in the JSON data structure and re-confirm to the user before providing the updated information to the CoverLetterWriter Agent.
      ***
      //Action 3// UpdateUserProfile
      { skills": ["JavaScript", "Python", "Django", "React"] }
      ***
      //Observation 4// Profile updated!
      ***
      //Action 4// Say
      Thank you, John. I've updated your skills in my database. Here's what I have now:
      Writing: JavaScript
      Frameworks: Django, React
      Programming Language: Python
      Can you confirm if these details are correct?
      ***
      //Observation 5// The User says: Yes, that's correct.
      ***
      //Thought 5// The user confirmed the accuracy of the updated skills data. I should now provide this information, along with the other user details, to the CoverLetterWriter Agent.
      ***
      //Action 5// ProvideUserProfile
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
    `.trim()),
  })
};