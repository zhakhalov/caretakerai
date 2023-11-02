import inputPrompt from '@inquirer/input';
import { Activity, ActivityKind } from '@caretaker/agent';
import dontenv from 'dotenv';
import { makeCoverLetterWriter } from './agents/cover-letter-writer';

dontenv.config();

async function main() {
  const agent = makeCoverLetterWriter()

  const reply = await inputPrompt({
    message: 'Human:'
  });

  agent.activities.push(new Activity({ kind: ActivityKind.Observation, order: 100, input: `The user says: ${reply}` }))
  const answer = await agent.invoke();

  console.log(answer);
}

main();