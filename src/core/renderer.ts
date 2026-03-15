/**
 * ANSI-aware terminal renderer with differential repainting.
 * Tracks previously rendered lines and only redraws changes.
 */

import { Writable } from 'node:stream';
import { ansi } from './ansi.js';

export class Renderer {
  private out: Writable;
  private prevLines: string[] = [];
  private prevCursorRow = 0;

  constructor(out: Writable) {
    this.out = out;
  }

  /** Render new content, diffing against previous output. */
  render(body: string): void {
    const lines = body.split('\n');
    const buf: string[] = [];

    // Move cursor to start of previously rendered area
    if (this.prevCursorRow > 0) {
      buf.push(ansi.cursorUp(this.prevCursorRow));
    }
    buf.push('\r');

    // Write each line, clearing to end
    for (let i = 0; i < Math.max(lines.length, this.prevLines.length); i++) {
      if (i > 0) buf.push('\n');
      buf.push(ansi.eraseLine);
      if (i < lines.length) {
        buf.push(lines[i]);
      }
    }

    // If previous output had more lines, clear extras
    if (this.prevLines.length > lines.length) {
      buf.push(ansi.eraseDown);
    }

    // Move cursor back to last line of new content
    const extraLines = Math.max(0, this.prevLines.length - lines.length);
    if (extraLines > 0) {
      buf.push(ansi.cursorUp(extraLines));
    }

    this.prevLines = lines;
    this.prevCursorRow = lines.length - 1;

    this.out.write(buf.join(''));
  }

  /** Clear all rendered content. */
  clear(): void {
    if (this.prevLines.length === 0) return;
    const buf: string[] = [];
    if (this.prevCursorRow > 0) {
      buf.push(ansi.cursorUp(this.prevCursorRow));
    }
    buf.push('\r');
    buf.push(ansi.eraseLine);
    buf.push(ansi.eraseDown);
    this.prevLines = [];
    this.prevCursorRow = 0;
    this.out.write(buf.join(''));
  }

  /** Write a final line after prompt completes (no tracking). */
  write(text: string): void {
    this.out.write(text);
  }
}
