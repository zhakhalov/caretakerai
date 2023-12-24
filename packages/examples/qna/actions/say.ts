import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import chalk from 'chalk';
import inputPrompt from '@inquirer/input';
import { Action, ActionInput } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

const SayParamsSchema = z.object({
  message: z.string().describe('message to say to the user'),
}).describe('Parameters for Say action');
type SayParams = z.infer<typeof SayParamsSchema>;
const SayParamsJsonSchema = zodToJsonSchema(SayParamsSchema, 'SayParamsSchema')
  .definitions!.SayParamsSchema as JSONSchema;

const SayResultSchema = z.string().describe('the users reply');
type SayResult = z.infer<typeof SayResultSchema>;
const SayResultJsonSchema = zodToJsonSchema(SayResultSchema, 'SayResultSchema')
  .definitions!.SayResultSchema as JSONSchema;

export class Say extends Action<SayParams, SayResult> {
  readonly params = SayParamsJsonSchema;
  readonly result = SayResultJsonSchema;
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