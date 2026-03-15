import { describe, it, expect } from 'vitest';
import { TogglePrompt } from '../src/prompts/toggle.js';
import { runWithInputs } from './helpers.js';

describe('TogglePrompt', () => {
  it('returns default false', async () => {
    const { result } = await runWithInputs(
      (io) => new TogglePrompt({ message: 'Enable?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toBe(false);
  });

  it('returns initial true', async () => {
    const { result } = await runWithInputs(
      (io) => new TogglePrompt({ message: 'Enable?', initial: true, stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'return' }],
    );
    expect(result).toBe(true);
  });

  it('toggles with space', async () => {
    const { result } = await runWithInputs(
      (io) => new TogglePrompt({ message: 'Enable?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'space' }, { key: 'return' }],
    );
    expect(result).toBe(true);
  });

  it('toggles with left/right arrows', async () => {
    const { result } = await runWithInputs(
      (io) => new TogglePrompt({ message: 'Enable?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'right' }, { key: 'return' }],
    );
    expect(result).toBe(true);
  });

  it('uses custom labels', async () => {
    const { output } = await runWithInputs(
      (io) => new TogglePrompt({
        message: 'Mode?',
        enabled: 'dark',
        disabled: 'light',
        stdin: io.stdin,
        stdout: io.stdout,
      }).run(),
      [{ key: 'return' }],
    );
    expect(output).toContain('light');
    expect(output).toContain('dark');
  });

  it('cancels on escape', async () => {
    const promise = runWithInputs(
      (io) => new TogglePrompt({ message: 'Enable?', stdin: io.stdin, stdout: io.stdout }).run(),
      [{ key: 'escape' }],
    );
    await expect(promise).rejects.toThrow('Prompt cancelled');
  });
});
