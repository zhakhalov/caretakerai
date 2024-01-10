import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Action, ActionInput } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

const SubtractParamsSchema = z.object({
  left: z.number().describe('Left operand'),
  right: z.number().describe('Right operand')
}).describe('Parameters for subtraction');
type SubtractParams = z.infer<typeof SubtractParamsSchema>;
const SubtractParamsJsonSchema = zodToJsonSchema(SubtractParamsSchema, 'SubtractParamsSchema')
  .definitions!.SubtractParamsSchema as JSONSchema;

const SubtractResultSchema = z.number().describe('The result of the subtraction');
type SubtractResult = z.infer<typeof SubtractResultSchema>;
const SubtractResultJsonSchema = zodToJsonSchema(SubtractResultSchema, 'SubtractResultSchema')
  .definitions!.SubtractResultSchema as JSONSchema;

export class Subtract extends Action<SubtractParams, SubtractResult> {
  readonly params = SubtractParamsJsonSchema
  readonly result = SubtractResultJsonSchema
  readonly exit = false;
  readonly kind = Subtract.name;
  readonly description = 'Subtract the numbers and provide you with the result.';
  readonly examples = [];

  async call({ params: { left, right } }: ActionInput<SubtractParams>): Promise<SubtractResult> {
    return left - right;
  }
}
