/**
 * Shared types for prompt options and choices.
 */

import type { Readable, Writable } from 'node:stream';
import type { PromptState } from './core/prompt.js';

export interface Choice {
  name: string;
  message?: string;
  value?: string;
  hint?: string;
  disabled?: boolean | string;
  role?: string;
  enabled?: boolean;
}

export type ChoiceInput = string | Choice;

export function normalizeChoices(choices: ChoiceInput[]): Choice[] {
  return choices.map((c) => {
    if (typeof c === 'string') {
      return { name: c, message: c, value: c };
    }
    return {
      ...c,
      message: c.message ?? c.name,
      value: c.value ?? c.name,
    };
  });
}

export interface BasePromptOptions {
  message: string;
  initial?: unknown;
  required?: boolean;
  skip?: boolean | (() => boolean);
  stdin?: Readable;
  stdout?: Writable;
  header?: string;
  footer?: string;
  hint?: string;
  validate?: (value: unknown, state: PromptState) => boolean | string | Promise<boolean | string>;
  format?: (value: unknown) => string | Promise<string>;
  result?: (value: unknown) => unknown | Promise<unknown>;
  onSubmit?: (name: string, value: unknown) => void;
  onCancel?: (name: string, value: unknown) => void;
}

export interface InputPromptOptions extends BasePromptOptions {
  type?: 'input';
  initial?: string;
  placeholder?: string;
}

export interface PasswordPromptOptions extends BasePromptOptions {
  type?: 'password';
  mask?: string;
}

export interface ConfirmPromptOptions extends BasePromptOptions {
  type?: 'confirm';
  initial?: boolean;
}

export interface SelectPromptOptions extends BasePromptOptions {
  type?: 'select';
  choices: ChoiceInput[];
  initial?: number | string;
  limit?: number;
}

export interface MultiSelectPromptOptions extends BasePromptOptions {
  type?: 'multiselect';
  choices: ChoiceInput[];
  initial?: number[];
  min?: number;
  max?: number;
  limit?: number;
}
