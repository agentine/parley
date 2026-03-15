import { describe, it, expect } from 'vitest';
import { InputPrompt } from '../src/prompts/input.js';
import { runWithInputs } from './helpers.js';

describe('InputPrompt', () => {
  it('returns typed text on enter', async () => {
    const { result } = await runWithInputs(
      (io) => new InputPrompt({ message: 'Name?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['hello', { key: 'return' }],
    );
    expect(result).toBe('hello');
  });

  it('returns initial value when enter pressed immediately', async () => {
    const { result } = await runWithInputs(
      (io) => new InputPrompt({ message: 'Name?', initial: 'default', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toBe('default');
  });

  it('handles backspace', async () => {
    const { result } = await runWithInputs(
      (io) => new InputPrompt({ message: 'Name?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['helloo', { key: 'backspace' }, { key: 'return' }],
    );
    expect(result).toBe('hello');
  });

  it('supports validation', async () => {
    const { result } = await runWithInputs(
      (io) => new InputPrompt({
        message: 'Name?',
        stdin: io.stdin,
        stdout: io.stdout,
        validate: (v) => (v as string).length >= 3 || 'Min 3 chars',
      }).run(),
      ['ab', { key: 'return' }, 'c', { key: 'return' }],
    );
    expect(result).toBe('abc');
  });

  it('supports format callback', async () => {
    const { result, output } = await runWithInputs(
      (io) => new InputPrompt({
        message: 'Name?',
        stdin: io.stdin,
        stdout: io.stdout,
        format: (v) => (v as string).toUpperCase(),
      }).run(),
      ['hello', { key: 'return' }],
    );
    expect(result).toBe('hello');
    expect(output).toContain('HELLO');
  });

  it('supports result callback', async () => {
    const { result } = await runWithInputs(
      (io) => new InputPrompt({
        message: 'Name?',
        stdin: io.stdin,
        stdout: io.stdout,
        result: (v) => (v as string).trim(),
      }).run(),
      ['  hello  ', { key: 'return' }],
    );
    expect(result).toBe('hello');
  });

  it('cancels on escape', async () => {
    const promise = runWithInputs(
      (io) => new InputPrompt({ message: 'Name?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'escape' }],
    );
    await expect(promise).rejects.toThrow('Prompt cancelled');
  });

  it('cancels on ctrl+c', async () => {
    const promise = runWithInputs(
      (io) => new InputPrompt({ message: 'Name?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'ctrl+c' }],
    );
    await expect(promise).rejects.toThrow('Prompt cancelled');
  });

  it('supports skip', async () => {
    const prompt = new InputPrompt({ message: 'Name?', skip: true, initial: 'skipped' });
    const result = await prompt.run();
    expect(result).toBe('skipped');
  });
});
