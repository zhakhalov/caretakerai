import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Action, ActionInput } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

const SumParamsSchema = z.array(z.number()).describe('Array of numbers to sum');
type SumParams = z.infer<typeof SumParamsSchema>;
const SumParamsJsonSchema = zodToJsonSchema(SumParamsSchema, 'SumParamsSchema')
  .definitions!.SumParamsSchema as JSONSchema;

const SumResultSchema = z.number().describe('The result of the summation');
type SumResult = z.infer<typeof SumResultSchema>;
const SumResultJsonSchema = zodToJsonSchema(SumResultSchema, 'SumResultSchema')
  .definitions!.SumResultSchema as JSONSchema;

export class Sum extends Action<SumParams, SumResult> {
  readonly params = SumParamsJsonSchema;
  readonly result = SumResultJsonSchema;
  readonly exit = false;
  readonly kind = Sum.name;
  readonly description = 'Sum the numbers and provide you with the result.';
  readonly examples = [];

  async call({ params }: ActionInput<SumParams>): Promise<SumResult> {
    return params.reduce((acc, n) => acc + n, 0);
  }
}
