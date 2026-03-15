/**
 * Enquirer compatibility layer.
 * Drop-in replacement for the enquirer package API.
 *
 * Usage:
 *   import Enquirer from '@agentine/parley/compat/enquirer';
 *   const response = await Enquirer.prompt({ type: 'input', name: 'username', message: 'Username?' });
 */

import {
  InputPrompt, PasswordPrompt, ConfirmPrompt, SelectPrompt, MultiSelectPrompt,
  TogglePrompt, NumberPrompt, AutocompletePrompt, ScalePrompt, SortPrompt,
  SnippetPrompt, ListPrompt, FormPrompt, EditablePrompt, QuizPrompt,
} from '../../prompts/index.js';
import { Prompt } from '../../core/prompt.js';

/* ── Type definitions for enquirer-compatible API ── */

interface EnquirerQuestion {
  type: string;
  name: string;
  message: string;
  initial?: unknown;
  choices?: unknown[];
  [key: string]: unknown;
}

type PromptConstructor = new (options: Record<string, unknown>) => Prompt;

type Plugin = (enquirer: Enquirer) => void;

/* ── Built-in prompt type registry ── */

const BUILTIN_TYPES: Record<string, PromptConstructor> = {
  input: InputPrompt as unknown as PromptConstructor,
  text: InputPrompt as unknown as PromptConstructor,
  password: PasswordPrompt as unknown as PromptConstructor,
  confirm: ConfirmPrompt as unknown as PromptConstructor,
  select: SelectPrompt as unknown as PromptConstructor,
  multiselect: MultiSelectPrompt as unknown as PromptConstructor,
  toggle: TogglePrompt as unknown as PromptConstructor,
  number: NumberPrompt as unknown as PromptConstructor,
  numeral: NumberPrompt as unknown as PromptConstructor,
  autocomplete: AutocompletePrompt as unknown as PromptConstructor,
  scale: ScalePrompt as unknown as PromptConstructor,
  sort: SortPrompt as unknown as PromptConstructor,
  snippet: SnippetPrompt as unknown as PromptConstructor,
  list: ListPrompt as unknown as PromptConstructor,
  form: FormPrompt as unknown as PromptConstructor,
  editable: EditablePrompt as unknown as PromptConstructor,
  quiz: QuizPrompt as unknown as PromptConstructor,
};

/* ── Enquirer class ── */

export class Enquirer {
  private registered: Record<string, PromptConstructor> = {};
  private plugins: Plugin[] = [];

  constructor(
    private questions?: EnquirerQuestion[],
    private options?: Record<string, unknown>,
  ) {}

  /** Register a custom prompt type. */
  register(type: string, PromptClass: PromptConstructor): this;
  register(types: Record<string, PromptConstructor>): this;
  register(
    typeOrTypes: string | Record<string, PromptConstructor>,
    PromptClass?: PromptConstructor,
  ): this {
    if (typeof typeOrTypes === 'string' && PromptClass) {
      this.registered[typeOrTypes] = PromptClass;
    } else if (typeof typeOrTypes === 'object') {
      Object.assign(this.registered, typeOrTypes);
    }
    return this;
  }

  /** Register a plugin. */
  use(plugin: Plugin): this {
    this.plugins.push(plugin);
    plugin(this);
    return this;
  }

  /** Run prompts and collect answers. */
  async prompt(
    questions?: EnquirerQuestion | EnquirerQuestion[],
  ): Promise<Record<string, unknown>> {
    const qs = questions
      ? (Array.isArray(questions) ? questions : [questions])
      : (this.questions ?? []);

    const answers: Record<string, unknown> = {};

    for (const q of qs) {
      const opts = { ...this.options, ...q } as Record<string, unknown>;
      const type = (opts.type as string) || 'input';
      const name = (opts.name as string) || 'prompt';

      const Ctor = this.registered[type] ?? BUILTIN_TYPES[type];
      if (!Ctor) {
        throw new Error(`Unknown prompt type: "${type}"`);
      }

      const prompt = new Ctor(opts);
      const result = await prompt.run();
      answers[name] = result;
    }

    return answers;
  }

  /** Static convenience method matching enquirer's API. */
  static async prompt(
    questions: EnquirerQuestion | EnquirerQuestion[],
  ): Promise<Record<string, unknown>> {
    const enquirer = new Enquirer();
    return enquirer.prompt(questions);
  }
}

/* ── Re-export individual prompt classes (enquirer-compatible imports) ── */

export {
  InputPrompt as Input,
  PasswordPrompt as Password,
  ConfirmPrompt as Confirm,
  SelectPrompt as Select,
  MultiSelectPrompt as MultiSelect,
  TogglePrompt as Toggle,
  NumberPrompt as NumberPrompt,
  AutocompletePrompt as AutoComplete,
  ScalePrompt as Scale,
  SortPrompt as Sort,
  SnippetPrompt as Snippet,
  ListPrompt as List,
  FormPrompt as Form,
  EditablePrompt as Editable,
  QuizPrompt as Quiz,
} from '../../prompts/index.js';

export default Enquirer;
