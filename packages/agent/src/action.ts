import dedent from 'dedent';
import type { Agent } from './agent';
import type { Activity } from './activity';
import { ACTIVITY_SEP } from './constants';

export interface ActionInput {
  input: string;
  agent: Agent;
}

export interface ActionExample {
  description?: string;
  activities: Activity[];
}

export abstract class Action {
  abstract get exit(): boolean;
  abstract get kind(): string;
  abstract get description(): string;
  abstract get examples(): ActionExample[];

  abstract execute(input: ActionInput): Promise<string>;

  toString() {
    const examples = this.examples
      .reduce((acc, { description, activities }) => dedent`
        ${acc}

        ${description}
        \`\`\`
        ${activities.map(a => a.toString()).join(`\n${ACTIVITY_SEP}\n`)}
        \`\`\`
      `.trim(), '');

    return dedent`
      ### ${this.kind}
      ${this.description}

      #### Examples
      ${examples}
      `.trim()
  }

  static parse(text: string) {
    const [kind, ...rest] = text.split('\n')

    return {
      kind: kind.trim(),
      input: rest.join('\n'),
    };
  }
}
