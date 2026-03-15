import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import { type ChoiceInput, normalizeChoices } from '../types.js';
import type { BasePromptOptions } from '../types.js';

export interface FormPromptOptions extends BasePromptOptions {
  type?: 'form';
  choices: ChoiceInput[];
}

interface FormField {
  name: string;
  message: string;
  value: string;
  initial: string;
}

export class FormPrompt extends Prompt<Record<string, string>> {
  declare options: FormPromptOptions;
  private fields: FormField[];
  private fieldIndex = 0;

  constructor(options: FormPromptOptions) {
    super(options);
    const choices = normalizeChoices(options.choices);
    this.fields = choices.map(c => ({
      name: c.name,
      message: c.message ?? c.name,
      value: '',
      initial: c.value ?? '',
    }));
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.formatHint();

    const lines: string[] = [`${prefix} ${msg}${hint}`];

    const maxLen = Math.max(...this.fields.map(f => f.message.length));

    for (let i = 0; i < this.fields.length; i++) {
      const field = this.fields[i];
      const pointer = i === this.fieldIndex ? ansi.cyan('❯') : ' ';
      const label = field.message.padEnd(maxLen);
      const display = field.value || ansi.gray(field.initial || '');
      const sep = ansi.gray(':');

      if (i === this.fieldIndex) {
        lines.push(`${pointer} ${ansi.cyan(label)} ${sep} ${display}${ansi.cyan('█')}`);
      } else {
        lines.push(`  ${label} ${sep} ${field.value || ansi.gray(field.initial || '')}`);
      }
    }

    const err = this.formatError();
    if (err) lines.push(err);

    return lines.join('\n');
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      const result: Record<string, string> = {};
      for (const field of this.fields) {
        result[field.name] = field.value || field.initial;
      }
      void this.submit(result);
      return;
    }

    if (key.name === 'up' || (key.shift && key.name === 'tab')) {
      this.fieldIndex = (this.fieldIndex - 1 + this.fields.length) % this.fields.length;
      this.render();
      return;
    }

    if (key.name === 'down' || key.name === 'tab') {
      this.fieldIndex = (this.fieldIndex + 1) % this.fields.length;
      this.render();
      return;
    }

    if (key.name === 'backspace') {
      const field = this.fields[this.fieldIndex];
      field.value = field.value.slice(0, -1);
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
      return;
    }

    if (!key.ctrl && !key.meta && key.raw.length === 1 && key.raw.charCodeAt(0) >= 32) {
      this.fields[this.fieldIndex].value += key.raw;
      this.render();
    }
  }
}

export function form(options: FormPromptOptions): Promise<Record<string, string>> {
  return new FormPrompt(options).run();
}
