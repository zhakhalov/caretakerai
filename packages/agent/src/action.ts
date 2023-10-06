import type { Agent } from './agent';

interface ActionInput {
  input: string;
  agent: Agent;
}

export abstract class Action {
  abstract get exit(): bool;
  abstract get kind(): string;
  abstract get description(): string;

  abstract execute(input: ActionInput): Promise<string>

  static parse(text: string) {
    const [kind, ...rest] = text.split('\n')

    return {
      kind,
      input: rest.join('\n'),
    };
  }
}
