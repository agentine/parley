import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import { type Choice, type ChoiceInput, normalizeChoices } from '../types.js';
import type { BasePromptOptions } from '../types.js';

export interface SortPromptOptions extends BasePromptOptions {
  type?: 'sort';
  choices: ChoiceInput[];
}

export class SortPrompt extends Prompt<string[]> {
  declare options: SortPromptOptions;
  private items: Choice[];
  private index = 0;
  private dragging = false;

  constructor(options: SortPromptOptions) {
    super(options);
    this.items = normalizeChoices(options.choices);
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.options.hint
      ? ansi.gray(` (${this.options.hint})`)
      : ansi.gray(' (arrows to move, space to grab/drop, enter to submit)');

    const lines: string[] = [`${prefix} ${msg}${hint}`];

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const pointer = i === this.index ? ansi.cyan('❯') : ' ';
      const label = item.message ?? item.name;
      const grip = this.dragging && i === this.index ? ansi.yellow('☰') : ansi.gray('☰');

      if (i === this.index) {
        lines.push(`${pointer} ${grip} ${this.dragging ? ansi.yellow(label) : ansi.cyan(label)}`);
      } else {
        lines.push(`  ${grip} ${label}`);
      }
    }

    const err = this.formatError();
    if (err) lines.push(err);

    return lines.join('\n');
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      const result = this.items.map(c => c.value ?? c.name);
      void this.submit(result);
      return;
    }

    if (key.name === 'space' || key.raw === ' ') {
      this.dragging = !this.dragging;
      this.render();
      return;
    }

    if (key.name === 'up') {
      if (this.dragging && this.index > 0) {
        // Swap items
        [this.items[this.index], this.items[this.index - 1]] =
          [this.items[this.index - 1], this.items[this.index]];
        this.index--;
      } else if (!this.dragging) {
        this.index = this.index > 0 ? this.index - 1 : this.items.length - 1;
      }
      this.render();
      return;
    }

    if (key.name === 'down') {
      if (this.dragging && this.index < this.items.length - 1) {
        [this.items[this.index], this.items[this.index + 1]] =
          [this.items[this.index + 1], this.items[this.index]];
        this.index++;
      } else if (!this.dragging) {
        this.index = this.index < this.items.length - 1 ? this.index + 1 : 0;
      }
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
    }
  }
}

export function sort(options: SortPromptOptions): Promise<string[]> {
  return new SortPrompt(options).run();
}
