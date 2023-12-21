import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Action, ActionInput } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

const DivideParamsSchema = z.object({
  left: z.number().describe('Left operand'),
  right: z.number().describe('Right operand')
}).describe('Parameters for division');
type DivideParams = z.infer<typeof DivideParamsSchema>;
const DivideParamsJsonSchema = zodToJsonSchema(DivideParamsSchema, 'DivideParamsSchema')
  .definitions!.DivideParamsSchema as JSONSchema;

const DivideResultSchema = z.number().describe('The result of the division');
type DivideResult = z.infer<typeof DivideResultSchema>;
const DivideResultJsonSchema = zodToJsonSchema(DivideResultSchema, 'DivideResultSchema')
  .definitions!.DivideResultSchema as JSONSchema;

export class Divide extends Action<DivideParams, DivideResult> {
  readonly params = DivideParamsJsonSchema;
  readonly result = DivideResultJsonSchema;
  readonly exit = false;
  readonly kind = Divide.name;
  readonly description = 'Divide the numbers and provide you with the result.';
  readonly examples = [];

  async call({ params: { left, right } }: ActionInput<DivideParams>): Promise<DivideResult> {
    if (right === 0) {
      throw new Error('Cannot divide by zero');
    }

    return left / right;
  }
}
