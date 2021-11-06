import { printDiagnostics } from '../../../utils/typescript/run-type-check';
import { fork } from 'child_process';
import { emitTypeDeclarations } from '../../../utils/typescript/emit-type-declarations';

if (require.main === module) {
  try {
    void main(JSON.parse(process.argv[2]));
  } catch {
    process.exitCode = 1;
  }
}

async function main(opts: {
  baseDir: string;
  configPath: string;
  outDir: string;
}) {
  const ts = await import('typescript');
  const result = await emitTypeDeclarations(
    ts,
    opts.baseDir,
    opts.configPath,
    opts.outDir
  );

  await printDiagnostics(result);

  if (result.errors.length > 0) {
    throw new Error('Found type errors. See above.');
  }
}

export async function forkTypeDeclarationEmitter(opts: {
  baseDir: string;
  configPath: string;
  outDir: string;
}) {
  return new Promise((resolve, reject) => {
    const proc = fork(__filename, [JSON.stringify(opts)], {
      cwd: opts.baseDir,
    });
    proc.on('close', (code) => (code === 0 ? resolve(code) : reject(code)));
  });
}
