import type { MessageFieldWithRole, MessageType } from '@langchain/core/messages';
import type { StringWithAutocomplete } from '@langchain/core/utils/types';
import type { Activity, ActivityTransformer } from './activity';

import { ActivityKind } from './activity';

export class ObservationTransformer implements ActivityTransformer {
  readonly kind = ActivityKind.Observation;
  readonly role: StringWithAutocomplete<'user' | 'assistant' | MessageType> = 'user';

  parse(text: string): Activity | null {
    const pattern = /<BEGIN\s+OBSERVATION>(.*?)<END\s+OBSERVATION>/is;
    const match = text.match(pattern);

    if (!match) {
      return null;
    }

    const input = match[1].trim()
      .replace(/^```yaml?\s*/i, '') // Remove opening ```yaml with optional whitespace
      .replace(/\s*```\s*$/, '')    // Remove closing ``` with optional whitespace
      .trim();

    return {
      kind: this.kind,
      input,
    }
  }

  stringify({ input }: Activity): MessageFieldWithRole {
    return {
      role: this.role,
      content:`
<BEGIN ${this.kind}>
\`\`\`yaml
${input}
\`\`\`
<END ${this.kind}>
      `.trim(),
    };
  }
}