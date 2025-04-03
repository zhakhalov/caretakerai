import type { MessageFieldWithRole, MessageType } from '@langchain/core/messages';
import type { StringWithAutocomplete } from '@langchain/core/utils/types';
import type { Activity, ActivityTransformer } from './activity';

import { ActivityKind } from './activity';

export class ThoughtTransformer implements ActivityTransformer {
  readonly kind = ActivityKind.Thought;
  readonly role: StringWithAutocomplete<'user' | 'assistant' | MessageType> = 'assistant';

  parse(text: string): Activity | null {
    const pattern = /<BEGIN\s+THOUGHT>(.*?)<END\s+THOUGHT>/is;
    const match = text.match(pattern);

    if (!match) {
      return null;
    }

    const input = match[1].trim();

    return {
      kind: this.kind,
      input,
    }
  }

  stringify({ input }: Activity): MessageFieldWithRole {
    return {
      role: 'assistant',
      content: `<BEGIN ${this.kind}>\n${input}\n<END ${this.kind}>`,
    };
  }
}