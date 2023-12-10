import { Element, js2xml, xml2js } from 'xml-js';

export enum ActivityKind {
  Observation = 'Observation',
  Thought = 'Thought',
  Action = 'Action'
}

export type ActivityParams = {
  kind: ActivityKind;
  input: string;
  attributes?: Record<string, string>;
  tokens?: number;
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

  static parse(text: string) {
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
