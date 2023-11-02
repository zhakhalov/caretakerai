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
    modelName: 'gpt-4',
    maxTokens: 1000,
  });

  const subordinates = [
    makeUserProfileDataExtractor(),
    makeJobProfileDataExtractor()
  ];

  return new Agent({
    name: 'CoverLetterWriter',
    description: 'specializes in assisting the user in composing cover letter and sending it to prospective employer.',
    llm,
    actions: [
      new Say(),
      new SendEmail(),
      new SearchAgent(subordinates),
      new Collaborate(subordinates),
    ],
    optimizer: new SimpleOptimizer(6000),
    instruction: dedent`
      As an CoverLetterWriter assistant,
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
    example: Agent.parseActivities(dedent`
      //Observation 1// The User says: I need help creating a cover letter for the Senior Software Developer position at XYZ corporation.
      ***
      //Thought 1// The user has requested help with creating a cover letter for a specific job role, but I lack the information on the user's skills and experience. Simultaneously, I don't have the job requirements for a Senior Software Developer position at XYZ corporation. To start creating an effective cover letter, I need to gather this necessary information. I should involve another AI agent who specializes in extracting such data.
      ***
      //Action 1// SearchAgent
      AI agent with capabilities in data extraction from user profiles and job descriptions.
      ***
      //Observation 2//  The search results revealed these pieces of information:
      UserProfileDataExtractor - specializes in extracting information from user profiles and their professional experience.
      [...]
      JobProfileDataExtractor - specializes in extracting job descriptions and their requirements.
      ***
      //Thought 2// UserProfileDataExtractor would be a beneficial tool for gathering specific information about the user's qualifications, experience, and skills. JobProfileDataExtractor, on the other hand, can provide information about the Senior Software Developer position at XYZ corporation. I'll initiate collaboration with both these agents.
      ***
      //Action 2// Collaborate
      UserProfileDataExtractor
      Gather the user's qualifications, experience, and skills.
      ***
      //Observation 3// UserProfileDataExtractor responded with this data:
      {
      "firstName": "Sam",
      "programmingSkills": ["Java", "Python", "JavaScript", "C#"],
      "experience": [
        {
          "company": "ABC Inc.",
          "position": "Software Developer",
          "duration": "3 years"
        },
        {
          "company": "DEF Ltd.",
          "position": "Senior Software Developer",
          "duration": "2 years"
        }
      ],
      "accomplishments": ["Developed an optimized search algorithm", "Managed a successful software development project"],
      "professionalValues": ["Teamwork", "Leadership", "Creativity"]
      }
      ***
      //Thought 3// I've now acquired crucial information about the user's skills, experience, and qualities, which will aid in drafting a personalized cover letter. I still lack the specific job requirements of the Senior Software Developer position at XYZ corporation. Therefore, I should now request collaboration with JobProfileDataExtractor.
      ***
      //Action 3// Collaborate
      JobProfileDataExtractor
      Obtain the job description and requirements for the Senior Software Developer position at XYZ corporation.
      ***
      //Observation 4// The JobProfileDataExtractor shared this job description and requirements:
      {
      "jobDescription": "Seeking a Senior Software Developer with practical experience in Java, Python and excellent leadership skills. A successful candidate will also demonstrate strong team collaboration and problem-solving skills.",
      "requirements": ["4+ years of experience with Java and Python", "Previous experience in a Leadership role", "Good communication skills", "experience with React or a similar JavaScript library"]
      }
      ***
      //Thought 4// I now have the necessary data about the user and job description. While some of the user's accomplishments and qualifications directly match the job description (Java, Python experience, and leadership skills), others such as the user's experience with JavaScript and C# may help broaden their appeal. I should now start tailoring the user's qualifications, experiences, and skills to the job description and requirements.
      ***
      //Action 4// Say
      Let's start working on your cover letter, Sam. One main point to focus on is your substantial experience with Java and Python, which aligns well with the job requirements. Additionally, your leadership skills and experience mirrors what XYZ corporation is seeking for in this position. Your proficiency in JavaScript and C# could also be appealing as it shows a broader knowledge base. Just before we proceed, do you have any specific aspects you'd like to focus on in the letter?
      //Observation 5// The User says: That sounds great! I would also like to highlight my experience managing successful software development projects and my team collaboration skills.
      ***
      //Thought 5// The user wishes to emphasize their project management experience and teamwork skills in the cover letter. This complements the job requirements provided by JobProfileDataExtractor. With this added information, I can now start drafting the cover letter, focusing on the user's experiences and skills that strongly align with the job description and the employer's expectations.
      ***
      //Action 5// Say
      Let's start drafting your letter:

      Dear Hiring Manager,

      I am writing to express my interest in the Senior Software Developer position at XYZ Corporation. With over five years of experience in software development and a proven track record of successful project management, I am confident in my ability to contribute effectively to your team.

      In my roles at ABC Inc. and DEF Ltd., I gained extensive experience in Java, Python, and JavaScript, which, as per the job description, are vital for the role. I have developed an optimized search algorithm that led to a significant performance boost, showcasing my problem-solving skills.

      In addition to technical skills, I have led teams, exemplifying my leadership skills and enthusiasm for teamwork. At DEF Ltd., I managed a successful software development project, further highlighting my ability to lead and collaborate with a team effectively.

      Once again, I am excited about the opportunity to bring these skills to XYZ corporation. Looking forward to the possibility of discussing my application further.

      Yours sincerely,
      Sam

      What do you think about the drafted cover letter? We can make changes as per your feedback.
      ***
      //Observation 6// The User says: It looks wonderful, thank you very much.
      ***
      //Thought 6// The user has approved the drafted cover letter without suggesting any changes. As per the user story acceptance criteria, the next step should be to send the finalized cover letter to the appropriate email address. I should first confirm with the user the email address to which the letter should be sent.
      ***
      //Action 6// Say
      I'm glad you found the cover letter satisfactory, Sam. Could you please confirm the email address where it should be sent?
      ***
      //Observation 7// The User says: Please send it to hiring@xyzcorp.com.
      ***
      //Thought 7// The user has provided the target email address. I can now proceed to dispatch the finalized cover letter as per the acceptance criteria of the user story.
      ***
      //Action 7// SendEmail
      {
      "emailAddress": "hiring@xyzcorp.com",
      "subject": "Application for Senior Software Developer Position",
      "body": "Dear Hiring Manager,

      I am writing to express my interest in the Senior Software Developer position at XYZ Corporation. With over five years of experience in software development and a proven track record of successful project management, I am confident in my ability to contribute effectively to your team.

      In my roles at ABC Inc. and DEF Ltd., I gained extensive experience in Java, Python, and JavaScript, which, as per the job description, are vital for the role. I have developed an optimized search algorithm that led to a significant performance boost, showcasing my problem-solving skills.

      In addition to technical skills, I have led teams, exemplifying my leadership skills and enthusiasm for teamwork. At DEF Ltd., I managed a successful software development project, further highlighting my ability to lead and collaborate with a team effectively.

      Once again, I am excited about the opportunity to bring these skills to XYZ corporation. Looking forward to the possibility of discussing my application further.

      Yours sincerely,
      Sam"
      }
    `.trim()),
  });
};
