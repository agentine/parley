# parley

Drop-in replacement for [enquirer](https://github.com/enquirer/enquirer) — interactive CLI prompts for Node.js.

Zero dependencies. TypeScript-first. ESM + CJS dual package. Node.js 18+.

## Install

```bash
npm install @agentine/parley
```

## Usage

### Functional API

```typescript
import { input, select, confirm } from '@agentine/parley';

const name = await input({ message: 'What is your name?' });
const color = await select({ message: 'Favorite color?', choices: ['red', 'green', 'blue'] });
const ok = await confirm({ message: 'Continue?' });
```

### Class API

```typescript
import { InputPrompt, SelectPrompt } from '@agentine/parley';

const prompt = new InputPrompt({ message: 'Username?', initial: 'guest' });
const username = await prompt.run();
```

### Enquirer Compatibility

Drop-in replacement for enquirer:

```typescript
import Enquirer from '@agentine/parley/compat/enquirer';

const response = await Enquirer.prompt([
  { type: 'input', name: 'username', message: 'Username?' },
  { type: 'password', name: 'password', message: 'Password?' },
]);
```

Or use individual prompt classes:

```typescript
import { Input, Select, Confirm } from '@agentine/parley/compat/enquirer';

const prompt = new Input({ message: 'Name?' });
const name = await prompt.run();
```

## Prompt Types

### Essential (covers ~80% of enquirer usage)

| Prompt | Description | Return Type |
|--------|-------------|-------------|
| `input` | Single-line text input | `string` |
| `password` | Masked text input | `string` |
| `confirm` | Yes/no boolean | `boolean` |
| `select` | Single choice from list | `string` |
| `multiselect` | Multiple choices from list | `string[]` |

### Extended

| Prompt | Description | Return Type |
|--------|-------------|-------------|
| `toggle` | Toggle between two values | `boolean` |
| `number` | Numeric input with min/max/step | `number` |
| `autocomplete` | Filterable select | `string` |
| `scale` | Likert scale | `Record<string, number>` |
| `sort` | Reorder a list | `string[]` |
| `snippet` | Template multi-field | `{ values, result }` |
| `list` | Comma-separated list | `string[]` |
| `form` | Multi-field form | `Record<string, string>` |
| `editable` | Multiselect with inline edit | `{ selected, values }` |
| `quiz` | Quiz with correct answer | `{ selected, correct }` |

## Options

All prompts support:

| Option | Type | Description |
|--------|------|-------------|
| `message` | `string` | Prompt message (required) |
| `initial` | varies | Default value |
| `hint` | `string` | Hint text shown in gray |
| `validate` | `(value) => boolean \| string` | Validation function |
| `format` | `(value) => string` | Format submitted value for display |
| `result` | `(value) => any` | Transform return value |
| `skip` | `boolean \| () => boolean` | Skip this prompt |

### Select/MultiSelect additional options

| Option | Type | Description |
|--------|------|-------------|
| `choices` | `(string \| Choice)[]` | List of choices |
| `limit` | `number` | Max visible choices (scrollable) |

### Choice object

```typescript
{
  name: string;       // Choice identifier
  message?: string;   // Display text (defaults to name)
  value?: string;     // Return value (defaults to name)
  hint?: string;      // Hint text
  disabled?: boolean | string;  // Disable with optional reason
  enabled?: boolean;  // Pre-selected (multiselect)
}
```

## Migration from enquirer

1. Install: `npm install @agentine/parley`
2. Update imports:

```diff
- const Enquirer = require('enquirer');
+ const Enquirer = require('@agentine/parley/compat/enquirer');
```

Or with ES modules:

```diff
- import Enquirer from 'enquirer';
+ import Enquirer from '@agentine/parley/compat/enquirer';
```

The compat layer supports:
- `Enquirer.prompt()` static method
- `new Enquirer().prompt()` instance method
- `.register()` for custom prompt types
- `.use()` for plugins
- Individual prompt class imports (`Input`, `Select`, etc.)

## License

MIT
