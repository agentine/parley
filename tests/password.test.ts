import { describe, it, expect } from 'vitest';
import { PasswordPrompt } from '../src/prompts/password.js';
import { runWithInputs } from './helpers.js';

describe('PasswordPrompt', () => {
  it('returns typed password on enter', async () => {
    const { result } = await runWithInputs(
      (io) => new PasswordPrompt({ message: 'Password?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['secret', { key: 'return' }],
    );
    expect(result).toBe('secret');
  });

  it('masks output with default * character', async () => {
    const { output } = await runWithInputs(
      (io) => new PasswordPrompt({ message: 'Password?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['abc', { key: 'return' }],
    );
    expect(output).toContain('***');
    expect(output).not.toContain('abc');
  });

  it('uses custom mask character', async () => {
    const { output } = await runWithInputs(
      (io) => new PasswordPrompt({ message: 'Password?', mask: '•', stdin: io.stdin, stdout: io.stdout }).run(),
      ['abc', { key: 'return' }],
    );
    expect(output).toContain('•••');
  });

  it('shows hidden text when mask is empty', async () => {
    const { output } = await runWithInputs(
      (io) => new PasswordPrompt({ message: 'Password?', mask: '', stdin: io.stdin, stdout: io.stdout }).run(),
      ['abc', { key: 'return' }],
    );
    expect(output).toContain('[hidden]');
  });

  it('handles backspace', async () => {
    const { result } = await runWithInputs(
      (io) => new PasswordPrompt({ message: 'Password?', stdin: io.stdin, stdout: io.stdout }).run(),
      ['secrett', { key: 'backspace' }, { key: 'return' }],
    );
    expect(result).toBe('secret');
  });

  it('cancels on escape', async () => {
    const promise = runWithInputs(
      (io) => new PasswordPrompt({ message: 'Password?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'escape' }],
    );
    await expect(promise).rejects.toThrow('Prompt cancelled');
  });
});
