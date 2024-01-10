import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Action, ActionInput } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

const AddParamsSchema = z.object({
  left: z.number().describe('Left operand'),
  right: z.number().describe('Right operand')
}).describe('Parameters for addition');
type AddParams = z.infer<typeof AddParamsSchema>;
const AddParamsJsonSchema = zodToJsonSchema(AddParamsSchema, 'AddParamsSchema')
  .definitions!.AddParamsSchema as JSONSchema;

const AddResultSchema = z.number().describe('The result of the addition');
type AddResult = z.infer<typeof AddResultSchema>;
const AddResultJsonSchema = zodToJsonSchema(AddResultSchema, 'AddResultSchema')
  .definitions!.AddResultSchema as JSONSchema;

export class Add extends Action<AddParams, AddResult> {
  readonly params = AddParamsJsonSchema
  readonly result = AddResultJsonSchema
  readonly exit = false;
  readonly kind = Add.name;
  readonly description = 'Add the numbers and provide you with the result.';
  readonly examples = [];

  async call({ params: { left, right } }: ActionInput<AddParams>): Promise<AddResult> {
    return left + right;
  }
}
