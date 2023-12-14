import dedent from 'dedent';
import { Action, ActionInput, Agent } from '@caretaker/agent';
import { JSONSchema } from 'json-schema-to-typescript';

export class Multiply extends Action {
  readonly exit = false;
  readonly kind = 'Multiply';
  readonly description = 'Multiply the numbers and provide you with the result.';
  readonly params: JSONSchema = {
    type: 'object',
    properties: {
      left: { type: 'number', description: 'Left operand' },
      right: { type: 'number', description: 'Right operand' }
    }
  }

  readonly result: JSONSchema = {
    type: 'number'
  };

  readonly examples = [];

  async call({ input }) {
    try {
        const numbers: number[] = JSON.parse(input);
        return numbers.reduce((acc, n) => acc * n, 1).toString();
    } catch (e) {
        const err = e as Error;
        return err.message;
    }
  }
}