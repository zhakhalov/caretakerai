import dedent from 'dedent';
import Ajv from 'ajv';
import ajvErrorsPlugin from 'ajv-errors';
import { PromptTemplate } from 'langchain/prompts';
import type { Agent } from './agent';
import { type JSONSchema, compile } from 'json-schema-to-typescript';
import { Activity } from './activity';
import { ACTIVITY_SEP } from './constants';

const ajv = ajvErrorsPlugin(
  new Ajv({
    useDefaults: true,
    removeAdditional: true,
    allErrors: true,
  })
);

const ACTION_TEMPLATE = (`
\`\`\`ts
/**
 * @kind {kind}
{description}
 * /

{params}

{result}
{examples}\`\`\`
`).trim();


export interface ActionInput<T> {
  params: T;
  agent: Agent;
}

export interface ActionExample {
  description?: string;
  activities: Activity[];
}

export abstract class Action<P = any, R = any> {
  abstract get exit(): boolean;
  abstract get kind(): string;
  abstract get description(): string;
  abstract get params(): JSONSchema;
  abstract get result(): JSONSchema;
  abstract get examples(): ActionExample[];

  abstract call(input: ActionInput<P>): Promise<R>;

  private _examplesPrompt() {
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
      .join('\n\n') + '\n'
  }

  async _prompt(template = ACTION_TEMPLATE) {
    const paramsType = `${this.kind}Params`;
    const resultType = `${this.kind}Result`;

    const partial = await PromptTemplate.fromTemplate(template).partial({
      params: async () => {
        const ts = await compile(this.params, paramsType, { bannerComment: '', additionalProperties: false });
        return ts.replace(/^(export\s*)/gm, '').trim()
      },
      result: async () => {
        const ts = await compile(this.result, resultType, { bannerComment: '', additionalProperties: false });
        return ts.replace(/^(export\s*)/gm, '').trim()
      },
      examples: () => this._examplesPrompt(),
      kind: this.kind,
      description: this.description
        .split('\n')
        .map(s => ` * ${s}`)
        .join('\n'),
      paramsType,
      resultType,
    });

    return partial
      .pipe(prompt => prompt.toString().trim())
      .invoke({});
  }

  async _call(input: string, agent: Agent) {
    const params = JSON.parse(input) as P;
    const validator = ajv.compile(this.params)
    const isValid = validator(params);

    if (!isValid) {
      throw new Error(`Action "${this.kind}" params are not valid: ${ajv.errorsText(validator.errors)} `);
    }

    const result = await this.call({ params, agent });

    if (typeof result === 'string') {
      return result;
    }

    return JSON.stringify(result);
  }
}
