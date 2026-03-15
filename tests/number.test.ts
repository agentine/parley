import { describe, it, expect } from 'vitest';
import { NumberPrompt } from '../src/prompts/number.js';
import { runWithInputs } from './helpers.js';

describe('NumberPrompt', () => {
  it('accepts numeric input', async () => {
    const { result } = await runWithInputs(
      (io) => new NumberPrompt({ message: 'Age?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['25', { key: 'return' }],
    );
    expect(result).toBe(25);
  });

  it('returns initial value on empty enter', async () => {
    const { result } = await runWithInputs(
      (io) => new NumberPrompt({ message: 'Age?', initial: 18, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    // Empty input returns null which fails validation, so let's test with initial set in input
    expect(result).toBe(18);
  });

  it('increments with up arrow', async () => {
    const { result } = await runWithInputs(
      (io) => new NumberPrompt({ message: 'Count?', initial: 5, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'up' }, { key: 'return' }],
    );
    expect(result).toBe(6);
  });

  it('decrements with down arrow', async () => {
    const { result } = await runWithInputs(
      (io) => new NumberPrompt({ message: 'Count?', initial: 5, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'down' }, { key: 'return' }],
    );
    expect(result).toBe(4);
  });

  it('respects min/max', async () => {
    const { result } = await runWithInputs(
      (io) => new NumberPrompt({ message: 'Count?', initial: 10, max: 10, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'up' }, { key: 'return' }],
    );
    expect(result).toBe(10);
  });

  it('uses custom step', async () => {
    const { result } = await runWithInputs(
      (io) => new NumberPrompt({ message: 'Count?', initial: 0, step: 5, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'up' }, { key: 'return' }],
    );
    expect(result).toBe(5);
  });

  it('handles negative numbers', async () => {
    const { result } = await runWithInputs(
      (io) => new NumberPrompt({ message: 'Temp?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['-10', { key: 'return' }],
    );
    expect(result).toBe(-10);
  });

  it('handles decimal numbers', async () => {
    const { result } = await runWithInputs(
      (io) => new NumberPrompt({ message: 'Price?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['3.14', { key: 'return' }],
    );
    expect(result).toBe(3.14);
  });

  it('cancels on escape', async () => {
    const promise = runWithInputs(
      (io) => new NumberPrompt({ message: 'Age?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'escape' }],
    );
    await expect(promise).rejects.toThrow('Prompt cancelled');
  });
});
