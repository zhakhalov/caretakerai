import { Element, js2xml, xml2js } from 'xml-js';

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
  /** Optional attributes to provide additional context for the activity. */
  attributes?: Record<string, string>;
}

export class Activity implements ActivityParams {
  kind!: ActivityKind;
  attributes?: Record<string, string>;
  input!: string;

  constructor(params: ActivityParams) {
    Object.assign(this, params);
  }

  prompt() {
    return js2xml(
      { [this.kind]: { _attributes: this.attributes ?? {}, _text: `\n${this.input}\n`, } },
      { compact: true },
    )
      .replaceAll('&lt;', '<')
      .replaceAll('&gt;', '>');
  }

  toObject() {
    return { ...this };
  }

  static fromObject({ kind, attributes, input }: Record<string, any>) {
    return new Activity({ kind, attributes, input });
  }

  static parse(text: string): Activity[] {
    const { elements: [root] } = xml2js(`<root>${text}</root>`, { trim: true } );

    return root.elements.map(({ name, attributes, elements }: Element) => {
      const input = js2xml({ elements })
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>');

      return Activity.fromObject({
        kind: name,
        input: input,
        attributes: attributes,
      });
    })
  }
}
