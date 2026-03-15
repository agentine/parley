import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import { type ChoiceInput, normalizeChoices } from '../types.js';
import type { BasePromptOptions } from '../types.js';

export interface EditablePromptOptions extends BasePromptOptions {
  type?: 'editable';
  choices: ChoiceInput[];
}

interface EditableItem {
  name: string;
  message: string;
  value: string;
  enabled: boolean;
}

export class EditablePrompt extends Prompt<{ selected: string[]; values: Record<string, string> }> {
  declare options: EditablePromptOptions;
  private items: EditableItem[];
  private index = 0;
  private editing = false;

  constructor(options: EditablePromptOptions) {
    super(options);
    const choices = normalizeChoices(options.choices);
    this.items = choices.map(c => ({
      name: c.name,
      message: c.message ?? c.name,
      value: c.value ?? '',
      enabled: c.enabled ?? false,
    }));
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.options.hint
      ? ansi.gray(` (${this.options.hint})`)
      : ansi.gray(' (space toggle, e edit, enter submit)');

    const lines: string[] = [`${prefix} ${msg}${hint}`];

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const pointer = i === this.index ? ansi.cyan('❯') : ' ';
      const check = item.enabled ? ansi.green('◉') : '◯';
      const label = item.message;

      if (this.editing && i === this.index) {
        lines.push(`${pointer} ${check} ${label}: ${item.value}${ansi.cyan('█')}`);
      } else if (i === this.index) {
        const valueDisplay = item.value ? ansi.gray(` = ${item.value}`) : '';
        lines.push(`${pointer} ${check} ${ansi.cyan(label)}${valueDisplay}`);
      } else {
        const valueDisplay = item.value ? ansi.gray(` = ${item.value}`) : '';
        lines.push(`  ${check} ${label}${valueDisplay}`);
      }
    }

    const err = this.formatError();
    if (err) lines.push(err);

    return lines.join('\n');
  }

  protected handleKey(key: Keypress): void {
    if (this.editing) {
      this.handleEditKey(key);
      return;
    }

    if (key.name === 'return') {
      const selected = this.items.filter(i => i.enabled).map(i => i.name);
      const values: Record<string, string> = {};
      for (const item of this.items) {
        values[item.name] = item.value;
      }
      void this.submit({ selected, values });
      return;
    }

    if (key.name === 'space' || key.raw === ' ') {
      this.items[this.index].enabled = !this.items[this.index].enabled;
      this.render();
      return;
    }

    if (key.name === 'e' && !key.ctrl && !key.meta) {
      this.editing = true;
      this.render();
      return;
    }

    if (key.name === 'up') {
      this.index = this.index > 0 ? this.index - 1 : this.items.length - 1;
      this.render();
      return;
    }

    if (key.name === 'down') {
      this.index = this.index < this.items.length - 1 ? this.index + 1 : 0;
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
    }
  }

  private handleEditKey(key: Keypress): void {
    if (key.name === 'return' || key.name === 'escape') {
      this.editing = false;
      this.render();
      return;
    }

    if (key.name === 'backspace') {
      this.items[this.index].value = this.items[this.index].value.slice(0, -1);
      this.render();
      return;
    }

    if (!key.ctrl && !key.meta && key.raw.length === 1 && key.raw.charCodeAt(0) >= 32) {
      this.items[this.index].value += key.raw;
      this.render();
    }
  }
}

export function editable(options: EditablePromptOptions): Promise<{ selected: string[]; values: Record<string, string> }> {
  return new EditablePrompt(options).run();
}
