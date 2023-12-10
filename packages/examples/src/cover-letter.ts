import inputPrompt from '@inquirer/input';
import { Activity, ActivityKind } from '@caretaker/agent';
import dontenv from 'dotenv';
import { makeCoverLetterWriter } from './collaboration/cover-letter-writer';

dontenv.config();

async function main() {
  const agent = makeCoverLetterWriter()
  agent.activities.push(new Activity({ kind: ActivityKind.Observation, input: 'The user says: How can you help me?' }))
  const answer = await agent.invoke();

  console.log(answer);
}

main();