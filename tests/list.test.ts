import { describe, it, expect } from 'vitest';
import { ListPrompt } from '../src/prompts/list.js';
import { runWithInputs } from './helpers.js';

describe('ListPrompt', () => {
  it('splits comma-separated input', async () => {
    const { result } = await runWithInputs(
      (io) => new ListPrompt({ message: 'Tags?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['foo, bar, baz', { key: 'return' }],
    );
    expect(result).toEqual(['foo', 'bar', 'baz']);
  });

  it('trims whitespace', async () => {
    const { result } = await runWithInputs(
      (io) => new ListPrompt({ message: 'Tags?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['  a , b , c  ', { key: 'return' }],
    );
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for empty input', async () => {
    const { result } = await runWithInputs(
      (io) => new ListPrompt({ message: 'Tags?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toEqual([]);
  });

  it('uses custom separator', async () => {
    const { result } = await runWithInputs(
      (io) => new ListPrompt({ message: 'Items?', separator: ';', stdin: io.stdin, stdout: io.stdout }).run(),
      ['a;b;c', { key: 'return' }],
    );
    expect(result).toEqual(['a', 'b', 'c']);
  });

  it('handles single item', async () => {
    const { result } = await runWithInputs(
      (io) => new ListPrompt({ message: 'Tag?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['single', { key: 'return' }],
    );
    expect(result).toEqual(['single']);
  });

  it('cancels on escape', async () => {
    const promise = runWithInputs(
      (io) => new ListPrompt({ message: 'Tags?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'escape' }],
    );
    await expect(promise).rejects.toThrow('Prompt cancelled');
  });
});
