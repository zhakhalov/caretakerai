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

/**
 * Parameters for creating a new Activity instance.
 */
export type ActivityParams = {
  /** The kind of activity. */
  kind: ActivityKind;
  /** The input or content of the activity. */
  input: string;
}

export class Activity implements ActivityParams {
  kind!: ActivityKind;
  attributes?: Record<string, string>;
  input!: string;

  constructor(params: ActivityParams) {
    Object.assign(this, params);
  }

  prompt() {
    if (this.kind === ActivityKind.Observation) {
      return `
<BEGIN ${this.kind}>
\`\`\`yaml
${this.input}
\`\`\`
<END ${this.kind}>
      `.trim();
    } else if (this.kind === ActivityKind.Action) {
      return `
<BEGIN ${this.kind}>
\`\`\`graphql
${this.input}
\`\`\`
<END ${this.kind}>
      `.trim();
    }

    return `<BEGIN ${this.kind}>\n${this.input}\n<END ${this.kind}>`;
  }

  toObject() {
    return { ...this };
  }

  static fromObject({ kind, input }: Record<string, any>) {
    return new Activity({ kind, input });
  }

  /**
   * Parse XML-like text structure into array of activities
   */
  static parse(text: string): Activity[] {
    // Ignore all possible free text outside activities tags
    const pattern = new RegExp(`<BEGIN\\s+(${ActivityKind.Thought}|${ActivityKind.Action}|${ActivityKind.Observation})>([\\s\\S]*?)<END\\s+\\1>`, 'g');
    const match = text.match(pattern);

    // Validate text for any activities
    if (!match) {
      throw new Error(`Could not extract activities from "${text}"`);
    }

    // Extract activities from match
    let activities = match.map(str => {
      const [, kind, input] = str.match(new RegExp(pattern, 's'));

      let cleanedInput = input.trim();

      if (kind === ActivityKind.Observation) {
        cleanedInput = cleanedInput
          .replace(/^```yaml?\s*/i, '')  // Remove leading ```yaml with optional whitespace
          .replace(/\s*```\s*$/, '')     // Remove trailing ``` with optional whitespace
          .trim();
      } else if (kind === ActivityKind.Action) {
        cleanedInput = cleanedInput
          .replace(/^```graphql?\s*/i, '') // Remove leading ```graphql with optional whitespace
          .replace(/\s*```\s*$/, '')       // Remove trailing ``` with optional whitespace
          .trim();
      }

      try {
        return new Activity({
          kind: kind as ActivityKind,
          input: cleanedInput,
        });
      } catch (e) {
        const err = e as Error;

        throw new Error(`Could not extract activity from "${str}": ${err}`);
      }
    });

    // Remove activities once sequence of Observation -> Thought -> Action is broken
    Activity.filterSequence(activities);

    return activities;
  }

  static validateSequence(activities: Activity[]) {
    activities.slice(0, -1).forEach((activity, index) => {
      const next = activities[index + 1];

      if (activity.kind === ActivityKind.Observation && next.kind !== ActivityKind.Thought) {
        throw new Error(`Observation at index ${index} must be followed by Thought`);
      }

      if (activity.kind === ActivityKind.Thought && next.kind !== ActivityKind.Action) {
        throw new Error(`Thought at index ${index} must be followed by Action`);
      }

      if (activity.kind === ActivityKind.Action && next.kind !== ActivityKind.Observation) {
        throw new Error(`Action at index ${index} must be followed by Observation`);
      }
    });
  }

  static filterSequence(activities: Activity[]): Activity[] {
    if (activities.length === 0) return activities;

    const result: Activity[] = [activities[0]];

    for (let i = 1; i < activities.length; i++) {
      const current = activities[i];
      const prev = result[result.length - 1];

      if (prev.kind === ActivityKind.Observation && current.kind !== ActivityKind.Thought) {
        break;
      }

      if (prev.kind === ActivityKind.Thought && current.kind !== ActivityKind.Action) {
        break;
      }

      if (prev.kind === ActivityKind.Action && current.kind !== ActivityKind.Observation) {
        break;
      }

      result.push(current);
    }

    return result;
  }
}
