import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import type { BasePromptOptions } from '../types.js';

export interface SnippetField {
  name: string;
  message?: string;
  initial?: string;
  validate?: (value: string) => boolean | string;
}

export interface SnippetPromptOptions extends BasePromptOptions {
  type?: 'snippet';
  template: string;
  fields?: SnippetField[];
  required?: boolean;
}

interface FieldState {
  name: string;
  message: string;
  value: string;
  initial: string;
  validate?: (value: string) => boolean | string;
}

export class SnippetPrompt extends Prompt<{ values: Record<string, string>; result: string }> {
  declare options: SnippetPromptOptions;
  private fields: FieldState[] = [];
  private fieldIndex = 0;

  constructor(options: SnippetPromptOptions) {
    super(options);
    this.parseTemplate();
  }

  private parseTemplate(): void {
    const regex = /\$\{(\w+)(?::([^}]*))?\}/g;
    let match: RegExpExecArray | null;
    const seen = new Set<string>();

    while ((match = regex.exec(this.options.template)) !== null) {
      const name = match[1];
      if (seen.has(name)) continue;
      seen.add(name);

      const fieldDef = this.options.fields?.find(f => f.name === name);
      this.fields.push({
        name,
        message: fieldDef?.message ?? name,
        value: fieldDef?.initial ?? match[2] ?? '',
        initial: fieldDef?.initial ?? match[2] ?? '',
        validate: fieldDef?.validate,
      });
    }
  }

  private interpolate(): string {
    let result = this.options.template;
    for (const field of this.fields) {
      const val = field.value || field.initial;
      result = result.replace(new RegExp(`\\$\\{${field.name}(?::[^}]*)?\\}`, 'g'), val);
    }
    return result;
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.options.hint
      ? ansi.gray(` (${this.options.hint})`)
      : ansi.gray(' (tab to move between fields)');

    const lines: string[] = [`${prefix} ${msg}${hint}`];

    // Show the template with highlighted current field
    const templateLines = this.options.template.split('\n');
    for (const tLine of templateLines) {
      let rendered = tLine;
      for (let i = 0; i < this.fields.length; i++) {
        const field = this.fields[i];
        const pattern = new RegExp(`\\$\\{${field.name}(?::[^}]*)?\\.?\\}`, 'g');
        const display = field.value || field.initial || field.name;
        if (i === this.fieldIndex) {
          rendered = rendered.replace(pattern, ansi.cyan(ansi.underline(display)));
        } else if (field.value) {
          rendered = rendered.replace(pattern, ansi.green(display));
        } else {
          rendered = rendered.replace(pattern, ansi.gray(display));
        }
      }
      lines.push('  ' + rendered);
    }

    const err = this.formatError();
    if (err) lines.push(err);

    return lines.join('\n');
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      // Validate all fields
      for (const field of this.fields) {
        if (this.options.required && !field.value && !field.initial) {
          this.error = `Field "${field.message}" is required`;
          this.render();
          return;
        }
        if (field.validate) {
          const result = field.validate(field.value || field.initial);
          if (result !== true && typeof result === 'string') {
            this.error = result;
            this.render();
            return;
          }
        }
      }

      const values: Record<string, string> = {};
      for (const field of this.fields) {
        values[field.name] = field.value || field.initial;
      }
      void this.submit({ values, result: this.interpolate() });
      return;
    }

    if (key.name === 'tab') {
      // Move to next field
      this.fieldIndex = (this.fieldIndex + 1) % this.fields.length;
      this.render();
      return;
    }

    if (key.shift && key.name === 'tab') {
      // Move to previous field
      this.fieldIndex = (this.fieldIndex - 1 + this.fields.length) % this.fields.length;
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

export function snippet(options: SnippetPromptOptions): Promise<{ values: Record<string, string>; result: string }> {
  return new SnippetPrompt(options).run();
}
