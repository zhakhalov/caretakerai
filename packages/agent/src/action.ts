import type { Agent } from './agent';

export interface ActionInput {
  input: string;
  agent: Agent;
}

export abstract class Action {
  abstract get exit(): boolean;
  abstract get kind(): string;
  abstract get description(): string;

  abstract execute(input: ActionInput): Promise<string>;

  toString() {
    return `- ${this.kind}: ${this.description}`
  }

  static parse(text: string) {
    const [kind, ...rest] = text.split('\n')

    return {
      kind,
      input: rest.join('\n'),
    };
  }
}
