import { describe, it, expect } from 'vitest';
import { ansi } from '../src/core/ansi.js';

describe('ansi', () => {
  describe('cursor movement', () => {
    it('moves cursor up', () => {
      expect(ansi.cursorUp(3)).toBe('\x1b[3A');
    });

    it('moves cursor down', () => {
      expect(ansi.cursorDown(2)).toBe('\x1b[2B');
    });

    it('moves cursor forward', () => {
      expect(ansi.cursorForward(5)).toBe('\x1b[5C');
    });

    it('moves cursor back', () => {
      expect(ansi.cursorBack(1)).toBe('\x1b[1D');
    });

    it('moves cursor to column', () => {
      expect(ansi.cursorTo(0)).toBe('\x1b[1G');
      expect(ansi.cursorTo(10)).toBe('\x1b[11G');
    });

    it('moves cursor to row and column', () => {
      expect(ansi.cursorTo(5, 3)).toBe('\x1b[4;6H');
    });

    it('moves cursor by delta', () => {
      expect(ansi.cursorMove(3, -2)).toBe('\x1b[2A\x1b[3C');
      expect(ansi.cursorMove(-1, 1)).toBe('\x1b[1B\x1b[1D');
      expect(ansi.cursorMove(0, 0)).toBe('');
    });

    it('hides and shows cursor', () => {
      expect(ansi.cursorHide).toBe('\x1b[?25l');
      expect(ansi.cursorShow).toBe('\x1b[?25h');
    });
  });

  describe('erasing', () => {
    it('erases full line', () => {
      expect(ansi.eraseLine).toBe('\x1b[2K');
    });

    it('erases to end of line', () => {
      expect(ansi.eraseLineEnd).toBe('\x1b[0K');
    });

    it('erases down', () => {
      expect(ansi.eraseDown).toBe('\x1b[J');
    });

    it('erases screen', () => {
      expect(ansi.eraseScreen).toBe('\x1b[2J');
    });
  });

  describe('text styling', () => {
    it('makes text bold', () => {
      expect(ansi.bold('hello')).toBe('\x1b[1mhello\x1b[22m');
    });

    it('makes text dim', () => {
      expect(ansi.dim('hello')).toBe('\x1b[2mhello\x1b[22m');
    });

    it('underlines text', () => {
      expect(ansi.underline('hello')).toBe('\x1b[4mhello\x1b[24m');
    });
  });

  describe('colors', () => {
    it('applies green', () => {
      expect(ansi.green('ok')).toBe('\x1b[32mok\x1b[39m');
    });

    it('applies cyan', () => {
      expect(ansi.cyan('info')).toBe('\x1b[36minfo\x1b[39m');
    });

    it('applies red', () => {
      expect(ansi.red('err')).toBe('\x1b[31merr\x1b[39m');
    });

    it('applies gray', () => {
      expect(ansi.gray('dim')).toBe('\x1b[90mdim\x1b[39m');
    });

    it('applies yellow', () => {
      expect(ansi.yellow('warn')).toBe('\x1b[33mwarn\x1b[39m');
    });
  });

  describe('strip', () => {
    it('removes ANSI codes from string', () => {
      expect(ansi.strip(ansi.bold(ansi.green('hello')))).toBe('hello');
    });

    it('handles plain strings', () => {
      expect(ansi.strip('hello')).toBe('hello');
    });

    it('handles empty strings', () => {
      expect(ansi.strip('')).toBe('');
    });

    it('strips nested styles', () => {
      const styled = ansi.bold(ansi.red('error: ') + ansi.cyan('details'));
      expect(ansi.strip(styled)).toBe('error: details');
    });
  });

  describe('visibleLength', () => {
    it('returns visible length without ANSI codes', () => {
      expect(ansi.visibleLength(ansi.green('hello'))).toBe(5);
    });

    it('returns regular string length', () => {
      expect(ansi.visibleLength('hello')).toBe(5);
    });

    it('handles empty strings', () => {
      expect(ansi.visibleLength('')).toBe(0);
    });
  });
});
