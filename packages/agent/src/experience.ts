import { TokenCounter } from './types'

export enum ExperienceKind {
  Observation = 'Observation',
  Thought = 'Thought',
  Action = 'Action'
}

export type ExperienceParams = {
  kind: ExperienceKind;
  order: number;
  input: string;
  tokens?: number;
}

export class Experience implements ExperienceParams {
  kind!: ExperienceKind;
  order!: number;
  input!: string;
  tokens?: number;

  static readonly defaults: Partial<ExperienceParams> = {
  }

  constructor(params: ExperienceParams) {
    Object.assign(this, params);
  }

  toString() {
    return `//${this.kind} ${this.order}// ${this.input}`;
  }

  toObject() {
    return { ...this };
  }

  static async parse(text: string, counter?: TokenCounter) {
    const kindRegexp = /^\/\/(.+?)\s/; // The first word after leading `//`
    const orderRegexp = /^\/\/\w+\s(.+?)\/\//;

    if (!kindRegexp.test(text)) {
      throw new Error('Cannot parse kind from the given text');
    }

    const kind = text.match(kindRegexp)?.[1].trim()! as ExperienceKind;

    if (!orderRegexp.test(text)) {
      throw new Error('Cannot parse order from the given text');
    }

    const order = parseInt(text.match(orderRegexp)?.[1].trim()!);

    const input = text.replace(/^\/\/.+\/\/\s/, '');
    const experience = new Experience({ kind, order, input });

    if (counter) {
      experience.tokens = await counter.count(experience.toString())
    }

    return experience;
  }

  static async fromObject(
    { kind, order, input }: Record<string, any>,
    counter?: TokenCounter,
  ) {
    const experience = new Experience({ kind, order, input });

    if (counter) {
      experience.tokens = await counter.count(experience.toString())
    }

    return experience;
  }
}
