import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import type { PasswordPromptOptions } from '../types.js';

export class PasswordPrompt extends Prompt<string> {
  private mask: string;
  declare options: PasswordPromptOptions;

  constructor(options: PasswordPromptOptions) {
    super(options);
    this.mask = options.mask ?? '*';
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.formatHint();

    let masked: string;
    if (this.mask) {
      masked = this.mask.repeat(this.input.length);
    } else {
      masked = ansi.gray('[hidden]');
    }

    let line = `${prefix} ${msg}${hint} ${masked}`;
    line += this.formatError();
    return line;
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      void this.submit(this.input);
      return;
    }

    if (key.name === 'backspace') {
      this.input = this.input.slice(0, -1);
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
      return;
    }

    // Regular character input
    if (!key.ctrl && !key.meta && key.raw.length === 1 && key.raw.charCodeAt(0) >= 32) {
      this.input += key.raw;
      this.render();
    }
  }
}

export function password(options: PasswordPromptOptions): Promise<string> {
  return new PasswordPrompt(options).run();
}
