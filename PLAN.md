# Parley — Implementation Plan

## Overview

**Replaces:** [enquirer](https://github.com/enquirer/enquirer) — interactive CLI prompts library for Node.js
**Package:** `@agentine/parley`
**Language:** TypeScript (Node.js)
**License:** MIT

## Why

Enquirer has ~12M weekly npm downloads, 7.9k GitHub stars, and ~3,895 npm dependents (including eslint, webpack, yarn, pm2, pnpm, Cypress, lint-staged, hardhat, AWS Amplify, GitHub Actions Toolkit). It hasn't been released in 3 years (v2.4.1), has 169 open issues and 38 unmerged PRs, and its maintainers (jonschlinkert, doowb) are inactive.

No maintained drop-in replacement exists. inquirer/@inquirer/prompts has a different API. prompts has a different API. There is no maintained fork.

## Architecture

### Core
- **Prompt base class** — handles readline, keypress events, rendering, validation, formatting
- **Renderer** — ANSI-aware terminal rendering with cursor management, line clearing, and repainting
- **Keypress handler** — cross-platform keypress event normalization (arrow keys, enter, escape, ctrl combos)
- **State machine** — prompt lifecycle: initialize → render → keypress loop → submit/cancel → result

### Prompt Types (matching enquirer's full set)
1. **Input** — single-line text input with optional initial value
2. **Password** — masked text input
3. **Confirm** — yes/no boolean prompt
4. **Select** — single choice from list (arrow key navigation)
5. **MultiSelect** — multiple choices from list (space to toggle, enter to submit)
6. **Toggle** — toggle between two values
7. **Number** — numeric input with optional min/max/step
8. **Autocomplete** — filterable select with text input
9. **Scale** — Likert scale prompt
10. **Sort** — reorder a list via arrow keys
11. **Snippet** — template-based multi-field input
12. **List** — comma-separated list input
13. **Form** — multi-field form prompt
14. **Editable** — editable list (multiselect with inline edit)
15. **Quiz** — quiz-style prompt with correct answer

### Compatibility Layer
- `parley/compat/enquirer` — drop-in module replacement matching enquirer's API:
  - `Enquirer` class with `.prompt()` method
  - `Enquirer.prompt()` static method
  - Individual prompt classes (e.g., `new Input({...})`)
  - Plugin system (`.use()`, `.register()`)

### Key Design Decisions
- **TypeScript-first** — full type safety for prompt options and return values
- **Zero dependencies** — implement ANSI handling and keypress internally (enquirer only depends on ansi-colors, which we replace)
- **ESM + CJS dual package** — `exports` field in package.json for both module systems
- **Node.js 18+** — leverage modern APIs (readline/promises, AbortController)
- **Streaming render** — efficient terminal updates using differential rendering

## Deliverables

1. Core prompt engine (base class, renderer, keypress, state machine)
2. All 15 prompt type implementations
3. enquirer compatibility layer (`parley/compat/enquirer`)
4. Full test suite (unit + integration, matching enquirer's test cases)
5. TypeScript declarations
6. Documentation and migration guide
7. Published `@agentine/parley` on npm

## Milestones

1. **Scaffolding** — project setup, build system, CI, linting
2. **Core engine** — base prompt, renderer, keypress handler, state machine
3. **Essential prompts** — Input, Password, Confirm, Select, MultiSelect (covers ~80% of usage)
4. **Extended prompts** — Toggle, Number, Autocomplete, Scale, Sort, Snippet, List, Form, Editable, Quiz
5. **Compatibility layer** — enquirer API compat, plugin system
6. **Testing & release** — comprehensive tests, benchmarks, docs, npm publish
