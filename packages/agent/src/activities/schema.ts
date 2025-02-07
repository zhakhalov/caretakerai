import type { MessageFieldWithRole, MessageType } from '@langchain/core/messages';
import type { StringWithAutocomplete } from '@langchain/core/utils/types';
import type { Activity, ActivityTransformer } from './activity';

export class SchemaTransformer implements ActivityTransformer {
  readonly kind = 'SCHEMA';
  readonly role: StringWithAutocomplete<'user' | 'assistant' | MessageType> = 'system';

  parse(text: string): Activity | null {
    return null;
  }

  render({ input }: Activity): MessageFieldWithRole {
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

export class OpenAIOSeriesSchemaTransformer extends SchemaTransformer {
  role: StringWithAutocomplete<'user' | 'assistant' | MessageType> = 'developer';
}