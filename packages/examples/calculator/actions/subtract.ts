import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Action, ActionInput } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

const SubtractParamsSchema = z.array(z.number()).describe('Array of numbers to subtract');
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

  async call({ params }: ActionInput<SubtractParams>): Promise<SubtractResult> {
    return params.reduce((acc, n) => acc - n);
  }
}
