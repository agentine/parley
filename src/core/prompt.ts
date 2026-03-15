/**
 * Base Prompt class — foundation for all prompt types.
 * State machine lifecycle: initial → running → submitted/cancelled
 */

import * as readline from 'node:readline';
import { type Readable, type Writable } from 'node:stream';
import { ansi } from './ansi.js';
import { type Keypress, parseKeypress } from './keypress.js';
import { Renderer } from './renderer.js';

export type PromptState = 'initial' | 'running' | 'submitted' | 'cancelled';

export interface PromptOptions {
  message: string;
  initial?: unknown;
  required?: boolean;
  skip?: boolean | (() => boolean);
  stdin?: Readable;
  stdout?: Writable;
  header?: string;
  footer?: string;
  hint?: string;

  /* Lifecycle hooks */
  validate?: (value: unknown, state: PromptState) => boolean | string | Promise<boolean | string>;
  format?: (value: unknown) => string | Promise<string>;
  result?: (value: unknown) => unknown | Promise<unknown>;
  onSubmit?: (name: string, value: unknown) => void;
  onCancel?: (name: string, value: unknown) => void;
}

export abstract class Prompt<T = unknown> {
  readonly options: PromptOptions;
  state: PromptState = 'initial';
  input: string = '';
  value: T | undefined;
  error: string = '';
  protected renderer: Renderer;
  protected stdin: Readable;
  protected stdout: Writable;
  private rl: readline.Interface | null = null;
  private resolve: ((value: T) => void) | null = null;
  private reject: ((err: Error) => void) | null = null;
  private keypressHandler: ((data: Buffer) => void) | null = null;

  constructor(options: PromptOptions) {
    this.options = options;
    this.stdin = (options.stdin ?? process.stdin) as Readable;
    this.stdout = (options.stdout ?? process.stdout) as Writable;
    this.renderer = new Renderer(this.stdout);
  }

  /** Run the prompt and return the result. */
  async run(): Promise<T> {
    // Check skip
    const skip = this.options.skip;
    if (skip === true || (typeof skip === 'function' && skip())) {
      return this.options.initial as T;
    }

    return new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
      this.start();
    });
  }

  private start(): void {
    this.state = 'running';

    // Set raw mode for stdin if it's a TTY
    if ('setRawMode' in this.stdin && typeof (this.stdin as NodeJS.ReadStream).setRawMode === 'function') {
      (this.stdin as NodeJS.ReadStream).setRawMode(true);
    }
    this.stdin.resume();

    // Create readline for cursor management
    this.rl = readline.createInterface({
      input: this.stdin,
      output: this.stdout,
      terminal: false,
    });

    // Hide cursor
    this.stdout.write(ansi.cursorHide);

    // Initialize subclass
    this.init();

    // Initial render
    this.renderPrompt();

    // Listen for raw keypress data
    this.keypressHandler = (data: Buffer) => {
      const keys = parseKeypress(data);
      for (const key of keys) {
        this.handleKeypress(key);
      }
    };
    this.stdin.on('data', this.keypressHandler);
  }

  /** Called once before the first render. Subclasses override for setup. */
  protected init(): void {
    // Default: no-op
  }

  /** Render the prompt. Subclasses must implement. */
  protected abstract renderBody(): string;

  /** Handle a keypress. Subclasses must implement. */
  protected abstract handleKey(key: Keypress): void;

  private handleKeypress(key: Keypress): void {
    if (this.state !== 'running') return;

    // Ctrl+C — cancel
    if (key.ctrl && key.name === 'c') {
      this.cancel();
      return;
    }

    this.error = '';
    this.handleKey(key);
  }

  private renderPrompt(): void {
    if (this.state !== 'running') return;
    const body = this.renderBody();
    this.renderer.render(body);
  }

  /** Request re-render (call after state changes). */
  protected render(): void {
    this.renderPrompt();
  }

  /** Submit the current value. */
  protected async submit(value?: T): Promise<void> {
    const val = value ?? this.value;

    // Validate
    if (this.options.validate) {
      const result = await this.options.validate(val, this.state);
      if (result !== true && typeof result === 'string') {
        this.error = result;
        this.render();
        return;
      }
      if (result === false) {
        this.error = 'Invalid input';
        this.render();
        return;
      }
    }

    this.state = 'submitted';
    this.value = val as T;

    // Format for display
    let display = String(val ?? '');
    if (this.options.format) {
      display = await this.options.format(val);
    }

    // Apply result transform
    let result = val;
    if (this.options.result) {
      result = (await this.options.result(val)) as T;
      this.value = result as T;
    }

    // Final render
    this.renderer.clear();
    this.stdout.write(`${ansi.green('✔')} ${ansi.bold(this.options.message)} ${ansi.cyan(display)}\n`);

    this.options.onSubmit?.('prompt', result);
    this.close();
    this.resolve?.(this.value as T);
  }

  /** Cancel the prompt. */
  protected cancel(): void {
    this.state = 'cancelled';

    this.renderer.clear();
    this.stdout.write(`${ansi.red('✖')} ${ansi.bold(this.options.message)} ${ansi.gray('(cancelled)')}\n`);

    this.options.onCancel?.('prompt', this.value);
    this.close();
    this.reject?.(new Error('Prompt cancelled'));
  }

  private close(): void {
    // Show cursor
    this.stdout.write(ansi.cursorShow);

    // Remove listeners
    if (this.keypressHandler) {
      this.stdin.removeListener('data', this.keypressHandler);
      this.keypressHandler = null;
    }

    // Close readline
    this.rl?.close();
    this.rl = null;

    // Restore raw mode
    if ('setRawMode' in this.stdin && typeof (this.stdin as NodeJS.ReadStream).setRawMode === 'function') {
      (this.stdin as NodeJS.ReadStream).setRawMode(false);
    }
    this.stdin.pause();
  }

  /** Format the prompt prefix with state indicator. */
  protected prefix(): string {
    if (this.state === 'submitted') return ansi.green('✔');
    if (this.state === 'cancelled') return ansi.red('✖');
    return ansi.cyan('?');
  }

  /** Format an error message. */
  protected formatError(): string {
    if (!this.error) return '';
    return `\n${ansi.red('>> ' + this.error)}`;
  }

  /** Format the hint. */
  protected formatHint(): string {
    if (!this.options.hint) return '';
    return ansi.gray(` (${this.options.hint})`);
  }
}
