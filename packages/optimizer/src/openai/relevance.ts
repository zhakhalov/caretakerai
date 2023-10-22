import { OpenAI } from 'openai';
import { Activity, Optimizer } from '@caretakerai/agent';

export class OpenAIRelevanceRecencyOptimizer implements Optimizer {
  constructor(
    private readonly openai: OpenAI
  ) {}

  async optimize(experience: Activity[]) {
    return experience;
  }
}