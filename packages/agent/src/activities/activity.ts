import { StringWithAutocomplete } from '@langchain/core/dist/utils/types';
import { MessageFieldWithRole, MessageType } from '@langchain/core/messages';

export const ACTIVITY_SEP = '\n\n';

/**
 * Enum representing the kinds of activities that an agent can perform.
 */
export enum ActivityKind {
  /** An observation made by the agent. */
  Observation = 'OBSERVATION',
  /** A thought process of the agent. */
  Thought = 'THOUGHT',
  /** An action taken by the agent. */
  Action = 'ACTION'
}

export type Activity = {
  kind: ActivityKind | string,
  input: string,
}

export type ActivityTransformer = {
  kind: string;
  role: StringWithAutocomplete<'user' | 'assistant' | MessageType>
  parse(text: string): Activity | null;
  stringify(activity: Activity): MessageFieldWithRole;
}

export function stringify(
  activities: Activity[],
  transformers: ActivityTransformer[]
): MessageFieldWithRole[] {
  return activities.reduce((messages: MessageFieldWithRole[], activity: Activity) => {
    const transformer = transformers.find(({ kind }) => kind === activity.kind);

    if (!transformer) {
      throw new Error(`No transformer found for activity kind: ${activity.kind}`);
    }

    const message = transformer.stringify(activity);
    const lastMessage = messages.at(-1);

    // Combine with previous message if same role
    if (lastMessage?.role === message.role) {
      lastMessage.content = `${lastMessage.content}${ACTIVITY_SEP}${message.content}`;
      return messages;
    }

    // Otherwise add as new message
    messages.push(message);
    return messages;
  }, []);
}