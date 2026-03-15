import { describe, it, expect } from 'vitest';
import { ConfirmPrompt } from '../src/prompts/confirm.js';
import { runWithInputs } from './helpers.js';

describe('ConfirmPrompt', () => {
  it('returns true for y', async () => {
    const { result } = await runWithInputs(
      (io) => new ConfirmPrompt({ message: 'Continue?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['y', { key: 'return' }],
    );
    expect(result).toBe(true);
  });

  it('returns false for n', async () => {
    const { result } = await runWithInputs(
      (io) => new ConfirmPrompt({ message: 'Continue?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['n', { key: 'return' }],
    );
    expect(result).toBe(false);
  });

  it('returns true for Y', async () => {
    const { result } = await runWithInputs(
      (io) => new ConfirmPrompt({ message: 'Continue?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['Y', { key: 'return' }],
    );
    expect(result).toBe(true);
  });

  it('returns false for N', async () => {
    const { result } = await runWithInputs(
      (io) => new ConfirmPrompt({ message: 'Continue?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['N', { key: 'return' }],
    );
    expect(result).toBe(false);
  });

  it('uses default false when enter pressed immediately', async () => {
    const { result } = await runWithInputs(
      (io) => new ConfirmPrompt({ message: 'Continue?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toBe(false);
  });

  it('uses initial true when enter pressed immediately', async () => {
    const { result } = await runWithInputs(
      (io) => new ConfirmPrompt({ message: 'Continue?', initial: true, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toBe(true);
  });

  it('ignores non y/n characters', async () => {
    const { result } = await runWithInputs(
      (io) => new ConfirmPrompt({ message: 'Continue?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['x', 'z', 'y', { key: 'return' }],
    );
    expect(result).toBe(true);
  });

  it('cancels on escape', async () => {
    const promise = runWithInputs(
      (io) => new ConfirmPrompt({ message: 'Continue?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'escape' }],
    );
    await expect(promise).rejects.toThrow('Prompt cancelled');
  });
});
