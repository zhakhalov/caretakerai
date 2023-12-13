import dedent from 'dedent';
import { PromptTemplate } from 'langchain/prompts';
import type { Agent } from './agent';
import { type JSONSchema, compile } from 'json-schema-to-typescript';
import { Activity } from './activity';
import { ACTIVITY_SEP } from './constants';

const ACTION_TEMPLATE = (`
\`\`\`ts
{params}

{result}

/**
{description}
 * @kind {kind}
 * @param {{{paramsType}}} params - {kind} action params
 * @returns {{Promise<{resultType}>}} {kind} action result
 * /
function {functionName}(params: {paramsType}): Promise<{resultType}>

{examples}
\`\`\`
`).trim();


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
  abstract get params(): JSONSchema;
  abstract get result(): JSONSchema;
  abstract get examples(): ActionExample[];

  abstract execute(input: ActionInput): Promise<string>;

  private examplesPrompt() {
    return this.examples
      .map(({ activities, description }) => [
        dedent`
        /**
         * @example ${description}`,
        activities.map(a => a.prompt())
          .join(ACTIVITY_SEP)
          .split('\n')
          .map(s => ` * ${s}`)
          .join('\n'),
        ' */'
      ].join('\n')
      )
      .join('\n\n')
  }

  async prompt(template = ACTION_TEMPLATE) {
    const paramsType = `${this.kind}Params`;
    const resultType = `${this.kind}Result`;
    const functionName = this.kind.charAt(0).toLowerCase() + this.kind.slice(1); // camel case action kind

    const partial = await PromptTemplate.fromTemplate(template).partial({
      params: () => compile(this.params, paramsType, { bannerComment: '' }),
      result: () => compile(this.result, resultType, { bannerComment: '' }),
      examples: () => this.examplesPrompt()
    });

    return partial.format({
      functionName,
      kind: this.kind,
      description: this.description
        .split('\n')
        .map(s => ` * ${s}`)
        .join('\n'),
      paramsType,
      resultType,
    });
  }
}
