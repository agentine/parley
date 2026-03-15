import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import { type Choice, type MultiSelectPromptOptions, normalizeChoices } from '../types.js';

export class MultiSelectPrompt extends Prompt<string[]> {
  declare options: MultiSelectPromptOptions;
  private choices: Choice[];
  private selected: Set<number>;
  private index = 0;
  private limit: number;
  private scrollOffset = 0;

  constructor(options: MultiSelectPromptOptions) {
    super(options);
    this.choices = normalizeChoices(options.choices);
    this.limit = options.limit ?? this.choices.length;
    this.selected = new Set<number>();

    // Set initial selections
    if (options.initial) {
      for (const idx of options.initial) {
        if (idx >= 0 && idx < this.choices.length) {
          this.selected.add(idx);
        }
      }
    }

    // Also check choice.enabled
    this.choices.forEach((c, i) => {
      if (c.enabled) this.selected.add(i);
    });

    this.skipDisabled(1);
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.options.hint
      ? ansi.gray(` (${this.options.hint})`)
      : ansi.gray(' (space to toggle, enter to submit)');

    const lines: string[] = [`${prefix} ${msg}${hint}`];

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
      const checked = this.selected.has(i) ? ansi.green('◉') : '◯';
      const label = choice.message ?? choice.name;
      const choiceHint = choice.hint ? ansi.gray(` — ${choice.hint}`) : '';

      if (choice.disabled) {
        const reason = typeof choice.disabled === 'string' ? choice.disabled : 'disabled';
        lines.push(`  ${ansi.gray('◯')} ${ansi.gray(label)} ${ansi.gray(`(${reason})`)}`);
      } else if (i === this.index) {
        lines.push(`${pointer} ${checked} ${ansi.cyan(label)}${choiceHint}`);
      } else {
        lines.push(`  ${checked} ${label}${choiceHint}`);
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
      const values = [...this.selected]
        .sort((a, b) => a - b)
        .map(i => this.choices[i].value ?? this.choices[i].name);

      // Check min/max constraints
      if (this.options.min != null && values.length < this.options.min) {
        this.error = `Select at least ${this.options.min}`;
        this.render();
        return;
      }
      if (this.options.max != null && values.length > this.options.max) {
        this.error = `Select at most ${this.options.max}`;
        this.render();
        return;
      }

      void this.submit(values);
      return;
    }

    if (key.name === 'space' || key.raw === ' ') {
      this.toggleCurrent();
      this.render();
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

    // 'a' toggles all
    if (key.name === 'a' && !key.ctrl && !key.meta) {
      const allSelected = this.choices.every((c, i) => c.disabled || this.selected.has(i));
      if (allSelected) {
        this.selected.clear();
      } else {
        this.choices.forEach((c, i) => {
          if (!c.disabled) this.selected.add(i);
        });
      }
      this.render();
      return;
    }

    // 'i' inverts selection
    if (key.name === 'i' && !key.ctrl && !key.meta) {
      this.choices.forEach((c, i) => {
        if (!c.disabled) {
          if (this.selected.has(i)) {
            this.selected.delete(i);
          } else {
            this.selected.add(i);
          }
        }
      });
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
      return;
    }
  }

  private toggleCurrent(): void {
    const choice = this.choices[this.index];
    if (choice?.disabled) return;

    if (this.selected.has(this.index)) {
      this.selected.delete(this.index);
    } else {
      if (this.options.max != null && this.selected.size >= this.options.max) {
        this.error = `Select at most ${this.options.max}`;
        return;
      }
      this.selected.add(this.index);
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

export function multiselect(options: MultiSelectPromptOptions): Promise<string[]> {
  return new MultiSelectPrompt(options).run();
}
