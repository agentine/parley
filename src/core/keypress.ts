/**
 * Cross-platform keypress event handler.
 * Parses raw stdin bytes into structured Keypress objects.
 */

export interface Keypress {
  name: string;
  raw: string;
  ctrl: boolean;
  meta: boolean;
  shift: boolean;
  sequence: string;
}

/** Create a Keypress from raw input bytes. */
export function parseKeypress(data: Buffer | string): Keypress[] {
  const s = typeof data === 'string' ? data : data.toString('utf-8');
  const keys: Keypress[] = [];

  let i = 0;
  while (i < s.length) {
    const key: Keypress = {
      name: '',
      raw: '',
      ctrl: false,
      meta: false,
      shift: false,
      sequence: '',
    };

    // ESC sequence
    if (s[i] === '\x1b') {
      // CSI sequences: ESC [ ...
      if (s[i + 1] === '[') {
        const csi = parseCsi(s, i);
        key.sequence = csi.seq;
        key.raw = csi.seq;
        key.name = csi.name;
        key.shift = csi.shift;
        key.meta = csi.meta;
        key.ctrl = csi.ctrl;
        i += csi.seq.length;
      }
      // SS3 sequences: ESC O ...
      else if (s[i + 1] === 'O') {
        const ss3 = parseSs3(s, i);
        key.sequence = ss3.seq;
        key.raw = ss3.seq;
        key.name = ss3.name;
        i += ss3.seq.length;
      }
      // Alt+key: ESC + char
      else if (i + 1 < s.length && s[i + 1] !== '\x1b') {
        key.meta = true;
        key.sequence = s.slice(i, i + 2);
        key.raw = s.slice(i, i + 2);
        const ch = s[i + 1];
        key.name = ch.toLowerCase();
        if (ch >= 'A' && ch <= 'Z') key.shift = true;
        i += 2;
      }
      // Bare ESC
      else {
        key.name = 'escape';
        key.sequence = '\x1b';
        key.raw = '\x1b';
        i += 1;
      }
    }
    // Control characters
    else if (s.charCodeAt(i) < 32) {
      const code = s.charCodeAt(i);
      key.raw = s[i];
      key.sequence = s[i];
      key.ctrl = true;

      switch (code) {
        case 0:
          key.name = 'space';
          break; // Ctrl+Space / Ctrl+@
        case 1:
          key.name = 'a';
          break;
        case 2:
          key.name = 'b';
          break;
        case 3:
          key.name = 'c';
          break;
        case 4:
          key.name = 'd';
          break;
        case 5:
          key.name = 'e';
          break;
        case 6:
          key.name = 'f';
          break;
        case 7:
          key.name = 'g';
          break;
        case 8:
          key.name = 'backspace';
          key.ctrl = false;
          break;
        case 9:
          key.name = 'tab';
          key.ctrl = false;
          break;
        case 10:
        case 13:
          key.name = 'return';
          key.ctrl = false;
          break;
        case 14:
          key.name = 'n';
          break;
        case 16:
          key.name = 'p';
          break;
        case 21:
          key.name = 'u';
          break;
        case 23:
          key.name = 'w';
          break;
        case 27:
          key.name = 'escape';
          key.ctrl = false;
          break;
        default:
          key.name = String.fromCharCode(code + 96);
          break;
      }
      i += 1;
    }
    // DEL (backspace on some terminals)
    else if (s.charCodeAt(i) === 127) {
      key.name = 'backspace';
      key.raw = s[i];
      key.sequence = s[i];
      i += 1;
    }
    // Regular characters
    else {
      // Handle multi-byte UTF-8
      const cp = s.codePointAt(i)!;
      const ch = String.fromCodePoint(cp);
      key.name = ch.toLowerCase();
      key.raw = ch;
      key.sequence = ch;
      if (ch !== ch.toLowerCase()) key.shift = true;
      i += ch.length;
    }

    keys.push(key);
  }

  return keys;
}

interface CsiResult {
  seq: string;
  name: string;
  shift: boolean;
  meta: boolean;
  ctrl: boolean;
}

function parseCsi(s: string, offset: number): CsiResult {
  // Minimum CSI: ESC [ <final>
  let end = offset + 2;
  // Collect parameter bytes (0x30-0x3F) and intermediate bytes (0x20-0x2F)
  while (end < s.length && s.charCodeAt(end) >= 0x20 && s.charCodeAt(end) <= 0x3f) {
    end++;
  }
  // Final byte
  if (end < s.length) end++;

  const seq = s.slice(offset, end);
  const body = seq.slice(2); // after ESC [
  const final = body[body.length - 1] || '';
  const params = body.slice(0, -1);

  let shift = false;
  let meta = false;
  let ctrl = false;

  // Parse modifier: CSI 1;mod X
  const parts = params.split(';');
  if (parts.length >= 2) {
    const mod = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(mod)) {
      const m = mod - 1;
      shift = !!(m & 1);
      meta = !!(m & 2);
      ctrl = !!(m & 4);
    }
  }

  let name = '';
  switch (final) {
    case 'A':
      name = 'up';
      break;
    case 'B':
      name = 'down';
      break;
    case 'C':
      name = 'right';
      break;
    case 'D':
      name = 'left';
      break;
    case 'E':
      name = 'clear';
      break;
    case 'F':
      name = 'end';
      break;
    case 'H':
      name = 'home';
      break;
    case 'Z':
      name = 'tab';
      shift = true;
      break;
    case '~': {
      const code = parts[0];
      switch (code) {
        case '1':
          name = 'home';
          break;
        case '2':
          name = 'insert';
          break;
        case '3':
          name = 'delete';
          break;
        case '4':
          name = 'end';
          break;
        case '5':
          name = 'pageup';
          break;
        case '6':
          name = 'pagedown';
          break;
        default:
          name = 'unknown';
          break;
      }
      break;
    }
    default:
      name = 'unknown';
      break;
  }

  return { seq, name, shift, meta, ctrl };
}

interface Ss3Result {
  seq: string;
  name: string;
}

function parseSs3(s: string, offset: number): Ss3Result {
  const seq = s.slice(offset, offset + 3);
  const ch = s[offset + 2] || '';
  let name = '';
  switch (ch) {
    case 'A':
      name = 'up';
      break;
    case 'B':
      name = 'down';
      break;
    case 'C':
      name = 'right';
      break;
    case 'D':
      name = 'left';
      break;
    case 'F':
      name = 'end';
      break;
    case 'H':
      name = 'home';
      break;
    case 'P':
      name = 'f1';
      break;
    case 'Q':
      name = 'f2';
      break;
    case 'R':
      name = 'f3';
      break;
    case 'S':
      name = 'f4';
      break;
    default:
      name = 'unknown';
      break;
  }
  return { seq, name };
}
