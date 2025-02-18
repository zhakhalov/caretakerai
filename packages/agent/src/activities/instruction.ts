import type { MessageFieldWithRole, MessageType } from '@langchain/core/messages';
import type { StringWithAutocomplete } from '@langchain/core/utils/types';
import type { Activity, ActivityTransformer } from './activity';

export class InstructionTransformer implements ActivityTransformer {
  readonly kind = 'INSTRUCTION';
  readonly role: StringWithAutocomplete<'user' | 'assistant' | MessageType> = 'system';

  parse(text: string): Activity | null {
    return null;
  }

  stringify({ input }: Activity): MessageFieldWithRole {
    return {
      role: this.role,
      content: `
<BEGIN ${this.kind}>
${input}
<END ${this.kind}>
`.trim(),
    };
  }
}

export class OpenAIOSeriesInstructionTransformer extends InstructionTransformer {
  role: StringWithAutocomplete<'user' | 'assistant' | MessageType> = 'developer';
}