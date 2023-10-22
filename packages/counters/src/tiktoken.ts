import { encoding_for_model, Tiktoken, TiktokenModel } from 'tiktoken';
import { TokenCounter } from '@caretakerai/agent';

export class TiktokenCounter implements TokenCounter {
  readonly encoding: Tiktoken;

  constructor (model: TiktokenModel) {
    this.encoding = encoding_for_model(model);
  }

  async count(text: string): Promise<number> {
    return this.encoding.encode(text).length;
  }

  release() {
    this.encoding.free();
  }
}