/**
 * ANSI escape code utilities for terminal control.
 * Zero dependencies — all codes are raw escape sequences.
 */

const ESC = '\x1b';
const CSI = `${ESC}[`;

export const ansi = {
  /* Cursor movement */
  cursorUp: (n = 1) => `${CSI}${n}A`,
  cursorDown: (n = 1) => `${CSI}${n}B`,
  cursorForward: (n = 1) => `${CSI}${n}C`,
  cursorBack: (n = 1) => `${CSI}${n}D`,
  cursorTo: (col: number, row?: number) =>
    row != null ? `${CSI}${row + 1};${col + 1}H` : `${CSI}${col + 1}G`,
  cursorMove: (dx: number, dy: number) => {
    let seq = '';
    if (dy < 0) seq += ansi.cursorUp(-dy);
    if (dy > 0) seq += ansi.cursorDown(dy);
    if (dx < 0) seq += ansi.cursorBack(-dx);
    if (dx > 0) seq += ansi.cursorForward(dx);
    return seq;
  },
  cursorSave: `${ESC}7`,
  cursorRestore: `${ESC}8`,
  cursorHide: `${CSI}?25l`,
  cursorShow: `${CSI}?25h`,

  /* Erasing */
  eraseLine: `${CSI}2K`,
  eraseLineEnd: `${CSI}0K`,
  eraseLineStart: `${CSI}1K`,
  eraseDown: `${CSI}J`,
  eraseUp: `${CSI}1J`,
  eraseScreen: `${CSI}2J`,

  /* Scrolling */
  scrollUp: (n = 1) => `${CSI}${n}S`,
  scrollDown: (n = 1) => `${CSI}${n}T`,

  /* Text styling */
  bold: (s: string) => `${CSI}1m${s}${CSI}22m`,
  dim: (s: string) => `${CSI}2m${s}${CSI}22m`,
  italic: (s: string) => `${CSI}3m${s}${CSI}23m`,
  underline: (s: string) => `${CSI}4m${s}${CSI}24m`,
  inverse: (s: string) => `${CSI}7m${s}${CSI}27m`,
  strikethrough: (s: string) => `${CSI}9m${s}${CSI}29m`,
  reset: `${CSI}0m`,

  /* Colors */
  green: (s: string) => `${CSI}32m${s}${CSI}39m`,
  cyan: (s: string) => `${CSI}36m${s}${CSI}39m`,
  yellow: (s: string) => `${CSI}33m${s}${CSI}39m`,
  red: (s: string) => `${CSI}31m${s}${CSI}39m`,
  gray: (s: string) => `${CSI}90m${s}${CSI}39m`,
  blue: (s: string) => `${CSI}34m${s}${CSI}39m`,
  magenta: (s: string) => `${CSI}35m${s}${CSI}39m`,

  /* Utility */
  beep: '\x07',
  link: (url: string, text: string) =>
    `${ESC}]8;;${url}${ESC}\\${text}${ESC}]8;;${ESC}\\`,

  /** Strip all ANSI escape codes from a string */
  strip: (s: string) =>
    // eslint-disable-next-line no-control-regex
    s.replace(/\x1b\[[0-9;]*[a-zA-Z]|\x1b\]8;;[^\x1b]*\x1b\\|\x1b[78]/g, ''),

  /** Get visible length (excluding ANSI codes) */
  visibleLength: (s: string) => ansi.strip(s).length,
};
