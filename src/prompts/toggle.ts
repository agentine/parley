import { Prompt } from '../core/prompt.js';
import { ansi } from '../core/ansi.js';
import type { Keypress } from '../core/keypress.js';
import type { BasePromptOptions } from '../types.js';

export interface TogglePromptOptions extends BasePromptOptions {
  type?: 'toggle';
  enabled?: string;
  disabled?: string;
  initial?: boolean;
}

export class TogglePrompt extends Prompt<boolean> {
  declare options: TogglePromptOptions;
  private enabled: string;
  private disabled: string;

  constructor(options: TogglePromptOptions) {
    super(options);
    this.enabled = options.enabled ?? 'on';
    this.disabled = options.disabled ?? 'off';
    this.value = options.initial ?? false;
  }

  protected renderBody(): string {
    const prefix = this.prefix();
    const msg = ansi.bold(this.options.message);
    const hint = this.formatHint();

    const disabledLabel = this.value ? this.disabled : ansi.underline(this.disabled);
    const enabledLabel = this.value ? ansi.underline(this.enabled) : this.enabled;
    const toggle = `${disabledLabel} / ${enabledLabel}`;

    let line = `${prefix} ${msg}${hint} ${ansi.cyan(toggle)}`;
    line += this.formatError();
    return line;
  }

  protected handleKey(key: Keypress): void {
    if (key.name === 'return') {
      void this.submit(this.value);
      return;
    }

    if (key.name === 'left' || key.name === 'right' || key.name === 'space' || key.raw === ' ') {
      this.value = !this.value;
      this.render();
      return;
    }

    // Typing the first letter of either option selects it
    if (key.raw && key.raw.toLowerCase() === this.enabled[0].toLowerCase()) {
      this.value = true;
      this.render();
      return;
    }

    if (key.raw && key.raw.toLowerCase() === this.disabled[0].toLowerCase()) {
      this.value = false;
      this.render();
      return;
    }

    if (key.name === 'escape') {
      this.cancel();
      return;
    }
  }
}

export function toggle(options: TogglePromptOptions): Promise<boolean> {
  return new TogglePrompt(options).run();
}
