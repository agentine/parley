import { describe, it, expect } from 'vitest';
import { SelectPrompt } from '../src/prompts/select.js';
import { runWithInputs } from './helpers.js';

describe('SelectPrompt', () => {
  const choices = ['red', 'green', 'blue'];

  it('selects first item by default', async () => {
    const { result } = await runWithInputs(
      (io) => new SelectPrompt({ message: 'Color?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toBe('red');
  });

  it('navigates down and selects', async () => {
    const { result } = await runWithInputs(
      (io) => new SelectPrompt({ message: 'Color?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'down' }, { key: 'return' }],
    );
    expect(result).toBe('green');
  });

  it('navigates up and wraps around', async () => {
    const { result } = await runWithInputs(
      (io) => new SelectPrompt({ message: 'Color?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'up' }, { key: 'return' }],
    );
    expect(result).toBe('blue');
  });

  it('wraps down to first', async () => {
    const { result } = await runWithInputs(
      (io) => new SelectPrompt({ message: 'Color?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'down' }, { key: 'down' }, { key: 'down' }, { key: 'return' }],
    );
    expect(result).toBe('red');
  });

  it('respects initial as number', async () => {
    const { result } = await runWithInputs(
      (io) => new SelectPrompt({ message: 'Color?', choices, initial: 2, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toBe('blue');
  });

  it('respects initial as string', async () => {
    const { result } = await runWithInputs(
      (io) => new SelectPrompt({ message: 'Color?', choices, initial: 'green', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toBe('green');
  });

  it('uses choice objects with value', async () => {
    const { result } = await runWithInputs(
      (io) => new SelectPrompt({
        message: 'Color?',
        choices: [
          { name: 'Red', value: '#ff0000' },
          { name: 'Green', value: '#00ff00' },
        ],
        stdin: io.stdin,
        stdout: io.stdout,
      }).run(),
      [{ key: 'return' }],
    );
    expect(result).toBe('#ff0000');
  });

  it('skips disabled choices', async () => {
    const { result } = await runWithInputs(
      (io) => new SelectPrompt({
        message: 'Color?',
        choices: [
          { name: 'Red' },
          { name: 'Green', disabled: true },
          { name: 'Blue' },
        ],
        stdin: io.stdin,
        stdout: io.stdout,
      }).run(),
      [{ key: 'down' }, { key: 'return' }],
    );
    expect(result).toBe('Blue');
  });

  it('cancels on escape', async () => {
    const promise = runWithInputs(
      (io) => new SelectPrompt({ message: 'Color?', choices, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'escape' }],
    );
    await expect(promise).rejects.toThrow('Prompt cancelled');
  });
});
