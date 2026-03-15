/**
 * Benchmark: startup time and memory usage.
 * Measures import/require time and heap footprint.
 */

async function measure(label: string, fn: () => Promise<void>): Promise<void> {
  const before = process.memoryUsage();
  const start = performance.now();

  await fn();

  const elapsed = performance.now() - start;
  const after = process.memoryUsage();
  const heapDelta = (after.heapUsed - before.heapUsed) / 1024;

  console.log(`${label}:`);
  console.log(`  Time: ${elapsed.toFixed(2)}ms`);
  console.log(`  Heap: ${heapDelta > 0 ? '+' : ''}${heapDelta.toFixed(0)}KB`);
  console.log();
}

async function main(): Promise<void> {
  console.log('=== Parley Startup Benchmark ===\n');

  await measure('Import @agentine/parley (all exports)', async () => {
    await import('../src/index.js');
  });

  await measure('Import compat/enquirer layer', async () => {
    await import('../src/compat/enquirer/index.js');
  });

  await measure('Create InputPrompt instance', async () => {
    const { InputPrompt } = await import('../src/prompts/input.js');
    for (let i = 0; i < 1000; i++) {
      new InputPrompt({ message: 'test' });
    }
  });

  await measure('Create SelectPrompt with 100 choices', async () => {
    const { SelectPrompt } = await import('../src/prompts/select.js');
    const choices = Array.from({ length: 100 }, (_, i) => `Option ${i}`);
    for (let i = 0; i < 1000; i++) {
      new SelectPrompt({ message: 'test', choices });
    }
  });

  console.log('=== Memory Snapshot ===');
  const mem = process.memoryUsage();
  console.log(`  RSS: ${(mem.rss / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  Heap Used: ${(mem.heapUsed / 1024 / 1024).toFixed(1)}MB`);
  console.log(`  Heap Total: ${(mem.heapTotal / 1024 / 1024).toFixed(1)}MB`);
}

main().catch(console.error);
