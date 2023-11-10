import dedent from 'dedent';
import { OpenAI } from 'openai';
import { Action, ActionInput, Agent } from '@caretaker/agent';
import { similarity } from 'ml-distance';

const jobProfiles = [
  {
      "jobTitle": "Software Developer",
      "companyName": "XYZ Corporation",
      "jobDescription": "Looking for a software developer with experience in Java, C++, and Python. Strong problem-solving skills and knowledge of algorithms and data structures is required.",
      "requirements": ["Bachelor's degree in Computer Science or related field", "2+ years of experience in software development", "Proficiency in Java, C++, and Python", "Strong problem-solving abilities", "Knowledge of algorithms and data structures"],
      "email": "hiring@xyz.com"
  },
  {
      "jobTitle": "Data Analyst",
      "companyName": "ABC Company",
      "jobDescription": "Seeking a data analyst with a strong understanding of data analysis tools and techniques, and experience in interpreting and reporting data.",
      "requirements": ["Bachelor’s degree in Mathematics or Statistics", "Experience in data models and reporting packages", "Ability to analyze large datasets", "Solid understanding of data analysis tools and techniques"],
      "email": "hiring@abc.com"
  },
  {
      "jobTitle": "Network Administrator",
      "companyName": "DEF Inc.",
      "jobDescription": "In search of a network administrator to maintain computer infrastructures with emphasis on networking. Good understanding of network protocols, and system security is a must.",
      "requirements": ["Bachelor's degree in Computer Science or related field", "Certifications such as Network+ or CCNA are a plus", "Understanding of network protocols and security", "Troubleshooting skills"],
      "email": "hiring@definc.com"
  }
];

export class GetJobProfile extends Action {
  readonly exit = false;
  readonly kind = GetJobProfile.name;
  readonly description = 'Use this action to find the job description that matches the request.';

  readonly examples = [
    {
      activities: Agent.parseActivities(dedent`
        //Observation 1// The Agent says: Obtain the job description and requirements for the Senior Software Developer position at XYZ corporation.
        //Thought 1// The Agent has requested the job description and requirements for the Senior Software Developer position at XYZ corporation. I need to search in the job description resource to gather this data.
        //Action 1// GetJobProfile
        Job description and requirements for the Senior Software Developer position at XYZ corporation.
      `)
    }
  ]

  async execute({ input }: ActionInput): Promise<string> {
    const jobProfilesText = jobProfiles.map(({ jobTitle, companyName, jobDescription, requirements }) => `${jobTitle} at ${companyName} - ${jobDescription}. ${requirements.join('; ')}`)

    const { data } = await new OpenAI().embeddings.create({
      model: 'text-embedding-ada-002',
      input: [input, ...jobProfilesText]
    });

    const [inputEmbedding, ...embeddings] = data;

    const profilesWithEmbeddings = embeddings
      .map(({ embedding }, index) => ({
        ...jobProfiles[index],
        similarity: similarity.cosine(inputEmbedding.embedding, embedding)
      }))
      .sort(({ similarity: similarityA }, { similarity: similarityB }) => similarityB - similarityA);

    return dedent`
      The search results revealed these pieces of information:
      \`\`\`
      ${JSON.stringify(profilesWithEmbeddings, null, 2)}
      \`\`\`
    `.trim();
  }
}

