import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import type { BasePromptOptions } from '../types.js';

export interface NumberPromptOptions extends BasePromptOptions {
  type?: 'numeral' | 'number';
  min?: number;
  max?: number;
  step?: number;
  float?: boolean;
  initial?: number;
}

export class NumberPrompt extends Prompt<number> {
  declare options: NumberPromptOptions;
  private step: number;

  constructor(options: NumberPromptOptions) {
    super(options);
    this.step = options.step ?? 1;
    if (options.initial != null) {
      this.input = String(options.initial);
      this.value = options.initial;
    }
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.formatHint();

    const display = this.input || ansi.gray('0');

    let line = `${prefix} ${msg}${hint} ${display}`;
    line += this.formatError();
    return line;
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      const num = this.parseNumber();
      if (num == null) {
        this.error = 'Please enter a valid number';
        this.render();
        return;
      }
      void this.submit(this.clamp(num));
      return;
    }

    if (key.name === 'up') {
      const current = this.parseNumber() ?? this.options.initial ?? 0;
      const next = this.clamp(current + this.step);
      this.input = String(next);
      this.value = next;
      this.render();
      return;
    }

    if (key.name === 'down') {
      const current = this.parseNumber() ?? this.options.initial ?? 0;
      const next = this.clamp(current - this.step);
      this.input = String(next);
      this.value = next;
      this.render();
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

    // Allow digits, minus, period
    if (!key.ctrl && !key.meta && /^[0-9.\-]$/.test(key.raw)) {
      // Only allow one minus at the start
      if (key.raw === '-' && (this.input.includes('-') || this.input.length > 0)) return;
      // Only allow one period
      if (key.raw === '.' && this.input.includes('.')) return;
      // Disallow period if not float mode
      if (key.raw === '.' && this.options.float === false) return;
      this.input += key.raw;
      this.render();
    }
  }

  private parseNumber(): number | null {
    if (!this.input) return null;
    const n = Number(this.input);
    return isNaN(n) ? null : n;
  }

  private clamp(n: number): number {
    if (this.options.min != null) n = Math.max(n, this.options.min);
    if (this.options.max != null) n = Math.min(n, this.options.max);
    return n;
  }
}

export function number(options: NumberPromptOptions): Promise<number> {
  return new NumberPrompt(options).run();
}
