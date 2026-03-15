import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import type { InputPromptOptions } from '../types.js';

export class InputPrompt extends Prompt<string> {
  private cursor = 0;
  declare options: InputPromptOptions;

  constructor(options: InputPromptOptions) {
    super(options);
    this.input = options.initial ?? '';
    this.cursor = this.input.length;
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.formatHint();

    let inputDisplay: string;
    if (this.input) {
      inputDisplay = this.input;
    } else if (this.options.placeholder) {
      inputDisplay = ansi.gray(this.options.placeholder);
    } else {
      inputDisplay = '';
    }

    let line = `${prefix} ${msg}${hint} ${inputDisplay}`;
    line += this.formatError();
    return line;
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      const val = this.input || (this.options.initial ?? '');
      void this.submit(val as string);
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

    if (key.name === 'delete') {
      if (this.cursor < this.input.length) {
        this.input = this.input.slice(0, this.cursor) + this.input.slice(this.cursor + 1);
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

    if (key.ctrl && key.name === 'a') {
      this.cursor = 0;
      this.render();
      return;
    }

    if (key.ctrl && key.name === 'e') {
      this.cursor = this.input.length;
      this.render();
      return;
    }

    if (key.ctrl && key.name === 'u') {
      this.input = this.input.slice(this.cursor);
      this.cursor = 0;
      this.render();
      return;
    }

    if (key.ctrl && key.name === 'k') {
      this.input = this.input.slice(0, this.cursor);
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
      return;
    }

    // Regular character input
    if (!key.ctrl && !key.meta && key.raw.length === 1 && key.raw.charCodeAt(0) >= 32) {
      this.input = this.input.slice(0, this.cursor) + key.raw + this.input.slice(this.cursor);
      this.cursor++;
      this.render();
    }
  }
}

export function input(options: InputPromptOptions): Promise<string> {
  return new InputPrompt(options).run();
}
