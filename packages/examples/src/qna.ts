import { OpenAI } from 'langchain/llms/openai';
import { Agent, Action } from '@caretaker/agent';

class Search extends Action {
  get exit() { return false; }
  get kind() { return 'Search'; }

  get description() {
    return 'Use this action to search for the informataion';
  }

  async execute({ input }) {
    return '';
  }
}

class Say extends Action {
  get kind() {
    return 'Search';
  }

  get description() {
    return 'Use this action to search for the informataion';
  }

  async execute({ input }) {
    return input;
  }
}

const llm = new OpenAI();

const agent = new Agent({
  llm,
  actions: [
    new Search(),
    new Say(),
  ],
  instruction: '',
  experience: [],
  example: [],
});

agent.run();