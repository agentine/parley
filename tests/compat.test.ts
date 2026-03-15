import { describe, it, expect } from 'vitest';
import { Enquirer, Input, Password, Confirm, Select, Toggle } from '../src/compat/enquirer/index.js';
import { createMockIO } from './helpers.js';

describe('Enquirer compat layer', () => {
  describe('Enquirer class', () => {
    it('has static prompt method', () => {
      expect(typeof Enquirer.prompt).toBe('function');
    });

    it('has instance prompt method', () => {
      const e = new Enquirer();
      expect(typeof e.prompt).toBe('function');
    });

    it('throws for unknown type', async () => {
      const io = createMockIO();

      const promise = new Enquirer().prompt({
        type: 'nonexistent' as string,
        name: 'test',
        message: 'Test?',
        stdin: io.stdin,
        stdout: io.stdout,
      } as never);

      await expect(promise).rejects.toThrow('Unknown prompt type: "nonexistent"');
    });

    it('runs input prompt via .prompt()', async () => {
      const io = createMockIO();

      const resultPromise = new Enquirer().prompt({
        type: 'input',
        name: 'username',
        message: 'Username?',
        stdin: io.stdin,
        stdout: io.stdout,
      } as never);

      await new Promise(resolve => setTimeout(resolve, 50));
      io.stdin.write('testuser');
      await new Promise(resolve => setTimeout(resolve, 10));
      io.stdin.write('\r');

      const result = await resultPromise;
      expect(result).toHaveProperty('username', 'testuser');
    });

    it('runs confirm prompt via .prompt()', async () => {
      const io = createMockIO();

      const resultPromise = new Enquirer().prompt({
        type: 'confirm',
        name: 'agree',
        message: 'Agree?',
        stdin: io.stdin,
        stdout: io.stdout,
      } as never);

      await new Promise(resolve => setTimeout(resolve, 50));
      io.stdin.write('y');
      await new Promise(resolve => setTimeout(resolve, 10));
      io.stdin.write('\r');

      const result = await resultPromise;
      expect(result).toHaveProperty('agree', true);
    });

    it('runs multiple prompts sequentially', async () => {
      const io = createMockIO();

      const resultPromise = new Enquirer().prompt([
        { type: 'input', name: 'first', message: 'First?', stdin: io.stdin, stdout: io.stdout },
        { type: 'input', name: 'last', message: 'Last?', stdin: io.stdin, stdout: io.stdout },
      ] as never);

      await new Promise(resolve => setTimeout(resolve, 50));
      io.stdin.write('John');
      await new Promise(resolve => setTimeout(resolve, 10));
      io.stdin.write('\r');

      await new Promise(resolve => setTimeout(resolve, 50));
      io.stdin.write('Doe');
      await new Promise(resolve => setTimeout(resolve, 10));
      io.stdin.write('\r');

      const result = await resultPromise;
      expect(result).toEqual({ first: 'John', last: 'Doe' });
    });

    it('supports register for custom types', () => {
      const e = new Enquirer();
      const result = e.register('custom', Input as never);
      expect(result).toBe(e); // returns this for chaining
    });

    it('supports use for plugins', () => {
      const e = new Enquirer();
      let called = false;
      e.use((enquirer) => {
        called = true;
        expect(enquirer).toBe(e);
      });
      expect(called).toBe(true);
    });
  });

  describe('individual prompt exports', () => {
    it('exports Input class', () => {
      expect(Input).toBeDefined();
      expect(typeof Input).toBe('function');
    });

    it('exports Password class', () => {
      expect(Password).toBeDefined();
    });

    it('exports Confirm class', () => {
      expect(Confirm).toBeDefined();
    });

    it('exports Select class', () => {
      expect(Select).toBeDefined();
    });

    it('exports Toggle class', () => {
      expect(Toggle).toBeDefined();
    });

    it('Input can be instantiated directly', async () => {
      const io = createMockIO();

      const prompt = new Input({
        message: 'Name?',
        stdin: io.stdin,
        stdout: io.stdout,
      } as never);

      const resultPromise = prompt.run();
      await new Promise(resolve => setTimeout(resolve, 50));
      io.stdin.write('test\r');
      const result = await resultPromise;
      expect(result).toBe('test');
    });
  });

  describe('default export', () => {
    it('Enquirer is the default export', async () => {
      const mod = await import('../src/compat/enquirer/index.js');
      expect(mod.default).toBe(Enquirer);
    });
  });
});
