import {
  printDiagnostics,
  runTypeCheck,
} from '../../../utils/typescript/run-type-check';
import { fork } from 'child_process';

if (require.main === module) {
  try {
    void main(JSON.parse(process.argv[2]));
  } catch {
    process.exitCode = 1;
  }
}

async function main(opts: { baseDir: string; configPath: string }) {
  const ts = await import('typescript');
  const result = await runTypeCheck(ts, opts.baseDir, opts.configPath);

  await printDiagnostics(result);

  if (result.errors.length > 0) {
    throw new Error('Found type errors. See above.');
  }
}

export async function forkTypeChecker(opts: {
  baseDir: string;
  configPath: string;
}) {
  return new Promise((resolve, reject) => {
    const proc = fork(__filename, [JSON.stringify(opts)], {
      cwd: opts.baseDir,
    });
    proc.on('close', (code) => (code === 0 ? resolve(code) : reject(code)));
  });
}
