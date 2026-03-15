import { describe, it, expect } from 'vitest';
import { parseKeypress } from '../src/core/keypress.js';

describe('parseKeypress', () => {
  it('parses regular characters', () => {
    const keys = parseKeypress('a');
    expect(keys).toHaveLength(1);
    expect(keys[0].name).toBe('a');
    expect(keys[0].ctrl).toBe(false);
    expect(keys[0].meta).toBe(false);
  });

  it('parses uppercase as shifted', () => {
    const keys = parseKeypress('A');
    expect(keys[0].name).toBe('a');
    expect(keys[0].shift).toBe(true);
  });

  it('parses enter/return', () => {
    const keys = parseKeypress('\r');
    expect(keys[0].name).toBe('return');
    expect(keys[0].ctrl).toBe(false);
  });

  it('parses newline', () => {
    const keys = parseKeypress('\n');
    expect(keys[0].name).toBe('return');
  });

  it('parses tab', () => {
    const keys = parseKeypress('\t');
    expect(keys[0].name).toBe('tab');
    expect(keys[0].ctrl).toBe(false);
  });

  it('parses backspace (DEL)', () => {
    const keys = parseKeypress('\x7f');
    expect(keys[0].name).toBe('backspace');
  });

  it('parses ctrl+c', () => {
    const keys = parseKeypress('\x03');
    expect(keys[0].name).toBe('c');
    expect(keys[0].ctrl).toBe(true);
  });

  it('parses ctrl+a', () => {
    const keys = parseKeypress('\x01');
    expect(keys[0].name).toBe('a');
    expect(keys[0].ctrl).toBe(true);
  });

  it('parses ctrl+d', () => {
    const keys = parseKeypress('\x04');
    expect(keys[0].name).toBe('d');
    expect(keys[0].ctrl).toBe(true);
  });

  it('parses escape', () => {
    const keys = parseKeypress('\x1b');
    expect(keys[0].name).toBe('escape');
  });

  it('parses arrow up (CSI)', () => {
    const keys = parseKeypress('\x1b[A');
    expect(keys[0].name).toBe('up');
  });

  it('parses arrow down', () => {
    const keys = parseKeypress('\x1b[B');
    expect(keys[0].name).toBe('down');
  });

  it('parses arrow right', () => {
    const keys = parseKeypress('\x1b[C');
    expect(keys[0].name).toBe('right');
  });

  it('parses arrow left', () => {
    const keys = parseKeypress('\x1b[D');
    expect(keys[0].name).toBe('left');
  });

  it('parses home', () => {
    const keys = parseKeypress('\x1b[H');
    expect(keys[0].name).toBe('home');
  });

  it('parses end', () => {
    const keys = parseKeypress('\x1b[F');
    expect(keys[0].name).toBe('end');
  });

  it('parses delete', () => {
    const keys = parseKeypress('\x1b[3~');
    expect(keys[0].name).toBe('delete');
  });

  it('parses page up', () => {
    const keys = parseKeypress('\x1b[5~');
    expect(keys[0].name).toBe('pageup');
  });

  it('parses page down', () => {
    const keys = parseKeypress('\x1b[6~');
    expect(keys[0].name).toBe('pagedown');
  });

  it('parses insert', () => {
    const keys = parseKeypress('\x1b[2~');
    expect(keys[0].name).toBe('insert');
  });

  it('parses shift+tab', () => {
    const keys = parseKeypress('\x1b[Z');
    expect(keys[0].name).toBe('tab');
    expect(keys[0].shift).toBe(true);
  });

  it('parses arrow up with shift modifier (CSI 1;2A)', () => {
    const keys = parseKeypress('\x1b[1;2A');
    expect(keys[0].name).toBe('up');
    expect(keys[0].shift).toBe(true);
  });

  it('parses arrow down with ctrl modifier (CSI 1;5B)', () => {
    const keys = parseKeypress('\x1b[1;5B');
    expect(keys[0].name).toBe('down');
    expect(keys[0].ctrl).toBe(true);
  });

  it('parses SS3 arrow up', () => {
    const keys = parseKeypress('\x1bOA');
    expect(keys[0].name).toBe('up');
  });

  it('parses SS3 F1-F4', () => {
    expect(parseKeypress('\x1bOP')[0].name).toBe('f1');
    expect(parseKeypress('\x1bOQ')[0].name).toBe('f2');
    expect(parseKeypress('\x1bOR')[0].name).toBe('f3');
    expect(parseKeypress('\x1bOS')[0].name).toBe('f4');
  });

  it('parses alt+key', () => {
    const keys = parseKeypress('\x1ba');
    expect(keys[0].name).toBe('a');
    expect(keys[0].meta).toBe(true);
  });

  it('parses multiple characters', () => {
    const keys = parseKeypress('abc');
    expect(keys).toHaveLength(3);
    expect(keys[0].name).toBe('a');
    expect(keys[1].name).toBe('b');
    expect(keys[2].name).toBe('c');
  });

  it('parses space', () => {
    const keys = parseKeypress(' ');
    expect(keys[0].name).toBe(' ');
    expect(keys[0].raw).toBe(' ');
  });

  it('handles buffer input', () => {
    const keys = parseKeypress(Buffer.from('hello'));
    expect(keys).toHaveLength(5);
    expect(keys[0].name).toBe('h');
  });
});
