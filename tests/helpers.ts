/**
 * Test helpers for simulating prompt interaction.
 * Provides mock stdin/stdout streams for non-interactive testing.
 */

import { PassThrough, Writable } from 'node:stream';

export interface MockIO {
  stdin: PassThrough & { setRawMode: (mode: boolean) => void };
  stdout: CaptureStream;
  send: (data: string | Buffer, delay?: number) => Promise<void>;
  sendKey: (name: string, delay?: number) => Promise<void>;
  getOutput: () => string;
}

/** Writable stream that captures all output. */
class CaptureStream extends Writable {
  private chunks: string[] = [];

  _write(chunk: Buffer | string, _encoding: string, callback: () => void): void {
    this.chunks.push(typeof chunk === 'string' ? chunk : chunk.toString('utf-8'));
    callback();
  }

  getOutput(): string {
    return this.chunks.join('');
  }

  clear(): void {
    this.chunks = [];
  }
}

/** Key sequence map for common keys. */
const KEY_SEQUENCES: Record<string, string> = {
  return: '\r',
  enter: '\r',
  escape: '\x1b',
  tab: '\t',
  backspace: '\x7f',
  delete: '\x1b[3~',
  up: '\x1b[A',
  down: '\x1b[B',
  right: '\x1b[C',
  left: '\x1b[D',
  home: '\x1b[H',
  end: '\x1b[F',
  space: ' ',
  'ctrl+c': '\x03',
  'ctrl+a': '\x01',
  'ctrl+e': '\x05',
  'ctrl+u': '\x15',
  'ctrl+k': '\x0b',
  'ctrl+d': '\x04',
  pageup: '\x1b[5~',
  pagedown: '\x1b[6~',
};

/** Create mock I/O for testing prompts. */
export function createMockIO(): MockIO {
  const stdin = new PassThrough() as PassThrough & { setRawMode: (mode: boolean) => void };
  // Mock setRawMode
  stdin.setRawMode = () => {};

  const stdout = new CaptureStream();

  const send = async (data: string | Buffer, delay = 10): Promise<void> => {
    await new Promise(resolve => setTimeout(resolve, delay));
    stdin.write(data);
    // Give prompt time to process
    await new Promise(resolve => setTimeout(resolve, delay));
  };

  const sendKey = async (name: string, delay = 10): Promise<void> => {
    const seq = KEY_SEQUENCES[name.toLowerCase()];
    if (!seq) throw new Error(`Unknown key: ${name}`);
    await send(seq, delay);
  };

  const getOutput = (): string => stdout.getOutput();

  return { stdin, stdout, send, sendKey, getOutput };
}

/** Run a prompt with scripted inputs. Returns the result. */
export async function runWithInputs<T>(
  promptFn: (io: { stdin: MockIO['stdin']; stdout: MockIO['stdout'] }) => Promise<T>,
  inputs: Array<string | { key: string }>,
  initialDelay = 50,
): Promise<{ result: T; output: string }> {
  const io = createMockIO();

  const resultPromise = promptFn({ stdin: io.stdin, stdout: io.stdout });

  // Prevent unhandled rejection warnings — we'll re-throw below
  let caughtError: unknown;
  const safePromise = resultPromise.catch((err) => { caughtError = err; });

  // Send inputs after a delay to let prompt initialize
  await new Promise(resolve => setTimeout(resolve, initialDelay));

  for (const input of inputs) {
    if (typeof input === 'string') {
      await io.send(input);
    } else {
      await io.sendKey(input.key);
    }
  }

  await safePromise;

  if (caughtError) throw caughtError;

  const result = await resultPromise;
  return { result, output: io.getOutput() };
}
