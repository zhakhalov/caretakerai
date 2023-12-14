import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import chalk from 'chalk';
import inputPrompt from '@inquirer/input';
import { Action, ActionInput, Agent } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

const SayParamsSchema = z.object({
  message: z.string().describe('message to say to the user'),
});

type SayParams = z.infer<typeof SayParamsSchema>;

const SayResultSchema = z.string().describe('the users reply');

type SayResult = z.infer<typeof SayResultSchema>;

export class Say extends Action<SayParams, SayResult> {
  readonly params: JSONSchema = zodToJsonSchema(SayParamsSchema, 'SayParamsSchema').definitions!.SayParamsSchema as JSONSchema;
  readonly result: JSONSchema = zodToJsonSchema(SayResultSchema, 'SayResultSchema').definitions!.SayResultSchema as JSONSchema;
  readonly exit = false;
  readonly kind = Say.name;
  readonly description = 'Use this function to relay information to the user.';
  readonly examples = [];

  async call({ params: { message }, agent }: ActionInput<SayParams>): Promise<SayResult> {
    console.log(`${chalk.bold(`${agent.name}:`)} ${message}`);

    const reply = await inputPrompt({
      message: 'Human:'
    });

    return `The user says: ${reply}`;
  }
}