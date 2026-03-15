import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import { type Choice, type ChoiceInput, normalizeChoices } from '../types.js';
import type { BasePromptOptions } from '../types.js';

export interface QuizPromptOptions extends BasePromptOptions {
  type?: 'quiz';
  choices: ChoiceInput[];
  correctChoice: number;
}

export class QuizPrompt extends Prompt<{ selected: string; correct: boolean }> {
  declare options: QuizPromptOptions;
  private choices: Choice[];
  private index = 0;
  private correctIndex: number;

  constructor(options: QuizPromptOptions) {
    super(options);
    this.choices = normalizeChoices(options.choices);
    this.correctIndex = options.correctChoice;
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.formatHint();

    const lines: string[] = [`${prefix} ${msg}${hint}`];

    for (let i = 0; i < this.choices.length; i++) {
      const choice = this.choices[i];
      const pointer = i === this.index ? ansi.cyan('❯') : ' ';
      const label = choice.message ?? choice.name;

      if (i === this.index) {
        lines.push(`${pointer} ${ansi.cyan(label)}`);
      } else {
        lines.push(`  ${label}`);
      }
    }

    const err = this.formatError();
    if (err) lines.push(err);

    return lines.join('\n');
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      const choice = this.choices[this.index];
      const correct = this.index === this.correctIndex;
      void this.submit({
        selected: choice.value ?? choice.name,
        correct,
      });
      return;
    }

    if (key.name === 'up') {
      this.index = this.index > 0 ? this.index - 1 : this.choices.length - 1;
      this.render();
      return;
    }

    if (key.name === 'down') {
      this.index = this.index < this.choices.length - 1 ? this.index + 1 : 0;
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
    }
  }
}

export function quiz(options: QuizPromptOptions): Promise<{ selected: string; correct: boolean }> {
  return new QuizPrompt(options).run();
}
