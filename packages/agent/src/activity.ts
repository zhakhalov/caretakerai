
/**
 * Enum representing the kinds of activities that an agent can perform.
 */
export enum ActivityKind {
  /** An observation made by the agent. */
  Observation = 'Observation',
  /** A thought process of the agent. */
  Thought = 'Thought',
  /** An action taken by the agent. */
  Action = 'Action'
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
    return `<${this.kind}>\n${this.input}\n</${this.kind}>`;
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
    const pattern = new RegExp(`<(${ActivityKind.Thought}|${ActivityKind.Action}|${ActivityKind.Observation})>(.*?)<\\/\\1>`);
    const match = text.match(new RegExp(pattern, 'gs'));

    // Validate text for any activities
    if (!match) {
      throw new Error(`Could not extract activities from "${text}"`);
    }

    // Extract activities from match
    const activities = match.map(str => {
      const [, kind, input] = str.match(new RegExp(pattern, 's'));

      try {
        return new Activity({
          kind: kind as ActivityKind,
          input: input.trim(),
        });
      } catch (e) {
        const err = e as Error;

        throw new Error(`Could not extract activity from "${str}": ${err}`);
      }
    });

    // Validate generated activities for correct sequence
    Activity.validateSequence(activities);

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
}
