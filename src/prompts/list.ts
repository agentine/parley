import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import type { BasePromptOptions } from '../types.js';

export interface ListPromptOptions extends BasePromptOptions {
  type?: 'list';
  separator?: string;
  initial?: string;
}

export class ListPrompt extends Prompt<string[]> {
  declare options: ListPromptOptions;
  private separator: string;
  private cursor = 0;

  constructor(options: ListPromptOptions) {
    super(options);
    this.separator = options.separator ?? ',';
    this.input = (options.initial as string) ?? '';
    this.cursor = this.input.length;
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.options.hint
      ? ansi.gray(` (${this.options.hint})`)
      : ansi.gray(` (comma-separated)`);

    const display = this.input || ansi.gray('item1, item2, ...');

    let line = `${prefix} ${msg}${hint} ${display}`;
    line += this.formatError();
    return line;
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      const items = this.input
        .split(this.separator)
        .map(s => s.trim())
        .filter(s => s.length > 0);
      void this.submit(items);
      return;
    }

    if (key.name === 'backspace') {
      if (this.cursor > 0) {
        this.input = this.input.slice(0, this.cursor - 1) + this.input.slice(this.cursor);
        this.cursor--;
      }
      this.render();
      return;
    }

    if (key.name === 'left') {
      if (this.cursor > 0) this.cursor--;
      this.render();
      return;
    }

    if (key.name === 'right') {
      if (this.cursor < this.input.length) this.cursor++;
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
      return;
    }

    if (!key.ctrl && !key.meta && key.raw.length === 1 && key.raw.charCodeAt(0) >= 32) {
      this.input = this.input.slice(0, this.cursor) + key.raw + this.input.slice(this.cursor);
      this.cursor++;
      this.render();
    }
  }
}

export function list(options: ListPromptOptions): Promise<string[]> {
  return new ListPrompt(options).run();
}
