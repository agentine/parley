import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import { type Choice, type SelectPromptOptions, normalizeChoices } from '../types.js';

export class SelectPrompt extends Prompt<string> {
  declare options: SelectPromptOptions;
  private choices: Choice[];
  private index = 0;
  private limit: number;
  private scrollOffset = 0;

  constructor(options: SelectPromptOptions) {
    super(options);
    this.choices = normalizeChoices(options.choices);
    this.limit = options.limit ?? this.choices.length;

    // Set initial index
    if (typeof options.initial === 'number') {
      this.index = Math.max(0, Math.min(options.initial, this.choices.length - 1));
    } else if (typeof options.initial === 'string') {
      const idx = this.choices.findIndex(c => c.name === options.initial || c.value === options.initial);
      if (idx >= 0) this.index = idx;
    }

    // Skip disabled choices
    this.skipDisabled(1);
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.formatHint();

    const lines: string[] = [`${prefix} ${msg}${hint}`];

    // Determine visible window
    const total = this.choices.length;
    const limit = Math.min(this.limit, total);

    if (this.index < this.scrollOffset) {
      this.scrollOffset = this.index;
    } else if (this.index >= this.scrollOffset + limit) {
      this.scrollOffset = this.index - limit + 1;
    }

    for (let i = this.scrollOffset; i < this.scrollOffset + limit && i < total; i++) {
      const choice = this.choices[i];
      const pointer = i === this.index ? ansi.cyan('❯') : ' ';
      const label = choice.message ?? choice.name;
      const hint = choice.hint ? ansi.gray(` — ${choice.hint}`) : '';

      if (choice.disabled) {
        const reason = typeof choice.disabled === 'string' ? choice.disabled : 'disabled';
        lines.push(`  ${ansi.gray(label)} ${ansi.gray(`(${reason})`)}`);
      } else if (i === this.index) {
        lines.push(`${pointer} ${ansi.cyan(label)}${hint}`);
      } else {
        lines.push(`  ${label}${hint}`);
      }
    }

    // Scroll indicators
    if (total > limit) {
      if (this.scrollOffset > 0) {
        lines[1] = ansi.gray('↑ ') + lines[1].slice(2);
      }
      if (this.scrollOffset + limit < total) {
        lines[lines.length - 1] = ansi.gray('↓ ') + lines[lines.length - 1].slice(2);
      }
    }

    const err = this.formatError();
    if (err) lines.push(err);

    return lines.join('\n');
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      const choice = this.choices[this.index];
      if (choice && !choice.disabled) {
        void this.submit((choice.value ?? choice.name) as string);
      }
      return;
    }

    if (key.name === 'up' || (key.ctrl && key.name === 'p')) {
      this.moveUp();
      this.render();
      return;
    }

    if (key.name === 'down' || (key.ctrl && key.name === 'n')) {
      this.moveDown();
      this.render();
      return;
    }

    if (key.name === 'home') {
      this.index = 0;
      this.skipDisabled(1);
      this.render();
      return;
    }

    if (key.name === 'end') {
      this.index = this.choices.length - 1;
      this.skipDisabled(-1);
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
      return;
    }
  }

  private moveUp(): void {
    if (this.index > 0) {
      this.index--;
      this.skipDisabled(-1);
    } else {
      this.index = this.choices.length - 1;
      this.skipDisabled(-1);
    }
  }

  private moveDown(): void {
    if (this.index < this.choices.length - 1) {
      this.index++;
      this.skipDisabled(1);
    } else {
      this.index = 0;
      this.skipDisabled(1);
    }
  }

  private skipDisabled(direction: 1 | -1): void {
    const len = this.choices.length;
    let tries = 0;
    while (tries < len && this.choices[this.index]?.disabled) {
      this.index = ((this.index + direction) % len + len) % len;
      tries++;
    }
  }
}

export function select(options: SelectPromptOptions): Promise<string> {
  return new SelectPrompt(options).run();
}
