import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import type { ConfirmPromptOptions } from '../types.js';

export class ConfirmPrompt extends Prompt<boolean> {
  declare options: ConfirmPromptOptions;

  constructor(options: ConfirmPromptOptions) {
    super(options);
    this.value = options.initial ?? false;
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);

    const initial = this.options.initial ?? false;
    const hint = initial ? '(Y/n)' : '(y/N)';

    let inputDisplay: string;
    if (this.input) {
      inputDisplay = this.input;
    } else {
      inputDisplay = ansi.gray(hint);
    }

    let line = `${prefix} ${msg} ${inputDisplay}`;
    line += this.formatError();
    return line;
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      let result: boolean;
      if (this.input === '') {
        result = this.options.initial ?? false;
      } else {
        result = this.input.toLowerCase().startsWith('y');
      }
      this.value = result;
      void this.submit(result);
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
      return;
    }

    if (key.name === 'backspace') {
      this.input = this.input.slice(0, -1);
      this.render();
      return;
    }

    // Only accept y/n/Y/N
    if (!key.ctrl && !key.meta && (key.raw === 'y' || key.raw === 'Y' || key.raw === 'n' || key.raw === 'N')) {
      this.input = key.raw;
      this.render();
    }
  }
}

export function confirm(options: ConfirmPromptOptions): Promise<boolean> {
  return new ConfirmPrompt(options).run();
}
