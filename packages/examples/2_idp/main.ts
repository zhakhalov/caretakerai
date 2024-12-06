import { config } from 'dotenv';
import { createAgent } from './agents/coordinator';

config();

async function main() {
  const agent = await createAgent();
  agent.invoke();
}

main();