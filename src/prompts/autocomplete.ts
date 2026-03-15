import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import { type Choice, type ChoiceInput, normalizeChoices } from '../types.js';
import type { BasePromptOptions } from '../types.js';

export interface AutocompletePromptOptions extends BasePromptOptions {
  type?: 'autocomplete';
  choices: ChoiceInput[];
  initial?: number | string;
  limit?: number;
  suggest?: (input: string, choices: Choice[]) => Choice[] | Promise<Choice[]>;
  multiple?: boolean;
}

export class AutocompletePrompt extends Prompt<string | string[]> {
  declare options: AutocompletePromptOptions;
  private allChoices: Choice[];
  private filtered: Choice[];
  private index = 0;
  private limit: number;
  private scrollOffset = 0;
  private selected: Set<string> = new Set();

  constructor(options: AutocompletePromptOptions) {
    super(options);
    this.allChoices = normalizeChoices(options.choices);
    this.filtered = [...this.allChoices];
    this.limit = options.limit ?? 10;

    if (typeof options.initial === 'number') {
      this.index = Math.max(0, Math.min(options.initial, this.filtered.length - 1));
    } else if (typeof options.initial === 'string') {
      const idx = this.filtered.findIndex(c => c.name === options.initial || c.value === options.initial);
      if (idx >= 0) this.index = idx;
    }
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.formatHint();

    const lines: string[] = [];
    lines.push(`${prefix} ${msg}${hint} ${this.input || ansi.gray('Type to filter...')}`);

    const total = this.filtered.length;
    const limit = Math.min(this.limit, total);

    if (this.index < this.scrollOffset) this.scrollOffset = this.index;
    if (this.index >= this.scrollOffset + limit) this.scrollOffset = this.index - limit + 1;

    if (total === 0) {
      lines.push(ansi.gray('  No matches'));
    } else {
      for (let i = this.scrollOffset; i < this.scrollOffset + limit && i < total; i++) {
        const choice = this.filtered[i];
        const pointer = i === this.index ? ansi.cyan('❯') : ' ';
        const label = choice.message ?? choice.name;
        const isSelected = this.selected.has(choice.value ?? choice.name);
        const check = this.options.multiple ? (isSelected ? ansi.green('◉ ') : '◯ ') : '';

        if (i === this.index) {
          lines.push(`${pointer} ${check}${ansi.cyan(label)}`);
        } else {
          lines.push(`  ${check}${label}`);
        }
      }
    }

    const err = this.formatError();
    if (err) lines.push(err);

    return lines.join('\n');
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      if (this.options.multiple) {
        void this.submit([...this.selected] as string[]);
      } else if (this.filtered[this.index]) {
        const choice = this.filtered[this.index];
        void this.submit((choice.value ?? choice.name) as string);
      }
      return;
    }

    if (key.name === 'up' || (key.ctrl && key.name === 'p')) {
      if (this.index > 0) this.index--;
      else this.index = this.filtered.length - 1;
      this.render();
      return;
    }

    if (key.name === 'down' || (key.ctrl && key.name === 'n')) {
      if (this.index < this.filtered.length - 1) this.index++;
      else this.index = 0;
      this.render();
      return;
    }

    if (key.name === 'space' && this.options.multiple) {
      const choice = this.filtered[this.index];
      if (choice) {
        const val = choice.value ?? choice.name;
        if (this.selected.has(val)) this.selected.delete(val);
        else this.selected.add(val);
      }
      this.render();
      return;
    }

    if (key.name === 'backspace') {
      this.input = this.input.slice(0, -1);
      void this.filter();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
      return;
    }

    if (!key.ctrl && !key.meta && key.raw.length === 1 && key.raw.charCodeAt(0) >= 32) {
      this.input += key.raw;
      void this.filter();
    }
  }

  private async filter(): Promise<void> {
    if (this.options.suggest) {
      this.filtered = await this.options.suggest(this.input, this.allChoices);
    } else {
      const lower = this.input.toLowerCase();
      this.filtered = this.allChoices.filter(c => {
        const label = (c.message ?? c.name).toLowerCase();
        return label.includes(lower);
      });
    }
    this.index = 0;
    this.scrollOffset = 0;
    this.render();
  }
}

export function autocomplete(options: AutocompletePromptOptions): Promise<string | string[]> {
  return new AutocompletePrompt(options).run();
}
