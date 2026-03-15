import { describe, it, expect } from 'vitest';
import { MultiSelectPrompt } from '../src/prompts/multiselect.js';
import { runWithInputs } from './helpers.js';

describe('MultiSelectPrompt', () => {
  const choices = ['red', 'green', 'blue'];

  it('returns empty array when none selected', async () => {
    const { result } = await runWithInputs(
      (io) => new MultiSelectPrompt({ message: 'Colors?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toEqual([]);
  });

  it('toggles selection with space', async () => {
    const { result } = await runWithInputs(
      (io) => new MultiSelectPrompt({ message: 'Colors?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'space' }, { key: 'return' }],
    );
    expect(result).toEqual(['red']);
  });

  it('selects multiple items', async () => {
    const { result } = await runWithInputs(
      (io) => new MultiSelectPrompt({ message: 'Colors?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'space' }, { key: 'down' }, { key: 'down' }, { key: 'space' }, { key: 'return' }],
    );
    expect(result).toEqual(['red', 'blue']);
  });

  it('deselects on second space', async () => {
    const { result } = await runWithInputs(
      (io) => new MultiSelectPrompt({ message: 'Colors?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'space' }, { key: 'space' }, { key: 'return' }],
    );
    expect(result).toEqual([]);
  });

  it('respects initial selections', async () => {
    const { result } = await runWithInputs(
      (io) => new MultiSelectPrompt({ message: 'Colors?', choices, initial: [1], stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toEqual(['green']);
  });

  it('validates min selections', async () => {
    const { result } = await runWithInputs(
      (io) => new MultiSelectPrompt({ message: 'Colors?', choices, min: 1, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }, { key: 'space' }, { key: 'return' }],
    );
    expect(result).toEqual(['red']);
  });

  it('select all with a key', async () => {
    const { result } = await runWithInputs(
      (io) => new MultiSelectPrompt({ message: 'Colors?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      ['a', { key: 'return' }],
    );
    expect(result).toEqual(['red', 'green', 'blue']);
  });

  it('invert selection with i key', async () => {
    const { result } = await runWithInputs(
      (io) => new MultiSelectPrompt({ message: 'Colors?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'space' }, 'i', { key: 'return' }],
    );
    expect(result).toEqual(['green', 'blue']);
  });

  it('cancels on escape', async () => {
    const promise = runWithInputs(
      (io) => new MultiSelectPrompt({ message: 'Colors?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'escape' }],
    );
    await expect(promise).rejects.toThrow('Prompt cancelled');
  });
});
