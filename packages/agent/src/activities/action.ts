import type { MessageFieldWithRole, MessageType } from '@langchain/core/messages';
import type { StringWithAutocomplete } from '@langchain/core/utils/types';
import type { Activity, ActivityTransformer } from './activity';

import { ActivityKind } from './activity';


export class ActionTransformer implements ActivityTransformer {
  readonly kind = ActivityKind.Action;
  readonly role: StringWithAutocomplete<'user' | 'assistant' | MessageType> = 'assistant';

  parse(text: string): Activity | null {
    const pattern = /<BEGIN\s+ACTION>(.*?)<END\s+ACTION>/is;
    const match = text.match(pattern);

    if (!match) {
      return null;
    }

    const input = match[1].trim()
      .replace(/^```graphql?\s*/i, '')  // Remove opening ```graphql tag with optional whitespace
      .replace(/\s*```\s*$/, '')        // Remove closing ``` with optional whitespace
      .trim();

    return {
      kind: this.kind,
      input,
    }
  }

  stringify({ input }: Activity): MessageFieldWithRole {
    return {
      role: this.role,
      content: `
<BEGIN ${this.kind}>
\`\`\`graphql
${input}
\`\`\`
<END ${this.kind}>
      `.trim(),
    };
  }
}