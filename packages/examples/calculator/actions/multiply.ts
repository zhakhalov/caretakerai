import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Action, ActionInput } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

const MultiplyParamsSchema = z.object({
  left: z.number().describe('Left operand'),
  right: z.number().describe('Right operand')
}).describe('Parameters for multiplication');
type MultiplyParams = z.infer<typeof MultiplyParamsSchema>;
const MultiplyParamsJsonSchema = zodToJsonSchema(MultiplyParamsSchema, 'MultiplyParamsSchema')
  .definitions!.MultiplyParamsSchema as JSONSchema;

const MultiplyResultSchema = z.number().describe('The result of the multiplication');
type MultiplyResult = z.infer<typeof MultiplyResultSchema>;
const MultiplyResultJsonSchema = zodToJsonSchema(MultiplyResultSchema, 'MultiplyResultSchema')
  .definitions!.MultiplyResultSchema as JSONSchema;

export class Multiply extends Action<MultiplyParams, MultiplyResult> {
  readonly params = MultiplyParamsJsonSchema
  readonly result = MultiplyResultJsonSchema
  readonly exit = false;
  readonly kind = Multiply.name;
  readonly description = 'Multiply the numbers and provide you with the result.';
  readonly examples = [];

  async call({ params: { left, right } }: ActionInput<MultiplyParams>): Promise<MultiplyResult> {
    return left * right;
  }
}
