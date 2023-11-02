export enum ActivityKind {
  Observation = 'Observation',
  Thought = 'Thought',
  Action = 'Action'
}

export type ActivityParams = {
  kind: ActivityKind;
  order: number;
  input: string;
  tokens?: number;
}

export class Activity implements ActivityParams {
  kind!: ActivityKind;
  order!: number;
  input!: string;
  tokens?: number;

  static readonly defaults: Partial<ActivityParams> = {
  }

  constructor(params: ActivityParams) {
    Object.assign(this, params);
  }

  toString() {
    return `//${this.kind} ${this.order}// ${this.input}`;
  }

  toObject() {
    return { ...this };
  }

  static parse(text: string) {
    const kindRegexp = /^\/\/(.+?)\s/; // The first word after leading `//`
    const orderRegexp = /^\/\/\w+\s(.+?)\/\//;

    if (!kindRegexp.test(text)) {
      throw new Error('Cannot parse kind from the given text');
    }

    const kind = text.match(kindRegexp)?.[1].trim()! as ActivityKind;

    if (!orderRegexp.test(text)) {
      throw new Error('Cannot parse order from the given text');
    }

    const order = parseInt(text.match(orderRegexp)?.[1].trim()!);

    const input = text.replace(/^\/\/.+\/\/\s/, '');
    const activity = new Activity({ kind, order, input });

    return activity;
  }

  static fromObject({ kind, order, input }: Record<string, any>) {
    return new Activity({ kind, order, input });
  }
}
