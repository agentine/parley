import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import type { BasePromptOptions } from '../types.js';

export interface ScaleChoice {
  name: string;
  message?: string;
  initial?: number;
}

export interface ScalePromptOptions extends BasePromptOptions {
  type?: 'scale';
  choices: ScaleChoice[];
  scale: { name: string; message?: string }[];
  margin?: [number, number, number, number];
  initial?: number;
}

interface ScaleItem {
  name: string;
  message: string;
  value: number;
}

export class ScalePrompt extends Prompt<Record<string, number>> {
  declare options: ScalePromptOptions;
  private items: ScaleItem[];
  private scaleLabels: { name: string; message: string }[];
  private rowIndex = 0;

  constructor(options: ScalePromptOptions) {
    super(options);
    this.scaleLabels = options.scale.map(s => ({
      name: s.name,
      message: s.message ?? s.name,
    }));
    const defaultVal = options.initial ?? 0;
    this.items = options.choices.map(c => ({
      name: c.name,
      message: c.message ?? c.name,
      value: c.initial ?? defaultVal,
    }));
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.formatHint();

    const lines: string[] = [`${prefix} ${msg}${hint}`];

    // Scale header
    const maxLabelLen = Math.max(...this.items.map(i => i.message.length), 10);
    const header = ' '.repeat(maxLabelLen + 2) + this.scaleLabels.map(s => s.message).join('  ');
    lines.push(ansi.gray(header));

    // Rows
    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const pointer = i === this.rowIndex ? ansi.cyan('❯') : ' ';
      const label = item.message.padEnd(maxLabelLen);

      const dots = this.scaleLabels.map((_, j) => {
        const pad = (this.scaleLabels[j].message.length - 1) / 2;
        const padStr = ' '.repeat(Math.max(0, Math.floor(pad)));
        if (j === item.value) {
          return padStr + ansi.cyan('●') + padStr;
        }
        return padStr + '○' + padStr;
      }).join('  ');

      if (i === this.rowIndex) {
        lines.push(`${pointer} ${ansi.cyan(label)} ${dots}`);
      } else {
        lines.push(`${pointer} ${label} ${dots}`);
      }
    }

    const err = this.formatError();
    if (err) lines.push(err);

    return lines.join('\n');
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      const result: Record<string, number> = {};
      for (const item of this.items) {
        result[item.name] = item.value;
      }
      void this.submit(result);
      return;
    }

    if (key.name === 'up') {
      if (this.rowIndex > 0) this.rowIndex--;
      else this.rowIndex = this.items.length - 1;
      this.render();
      return;
    }

    if (key.name === 'down') {
      if (this.rowIndex < this.items.length - 1) this.rowIndex++;
      else this.rowIndex = 0;
      this.render();
      return;
    }

    if (key.name === 'left') {
      const item = this.items[this.rowIndex];
      if (item.value > 0) item.value--;
      this.render();
      return;
    }

    if (key.name === 'right') {
      const item = this.items[this.rowIndex];
      if (item.value < this.scaleLabels.length - 1) item.value++;
      this.render();
      return;
    }

    // Number key direct selection
    const num = parseInt(key.raw, 10);
    if (!isNaN(num) && num >= 0 && num < this.scaleLabels.length) {
      this.items[this.rowIndex].value = num;
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
    }
  }
}

export function scale(options: ScalePromptOptions): Promise<Record<string, number>> {
  return new ScalePrompt(options).run();
}
