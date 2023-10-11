import type { Experience } from './experience';

export interface TokenCounter {
  count(text: string): Promise<number>
}

export interface ContextTrimmer {
  trim(experience: Experience[], k: number): Promise<Experience[]>;
}
