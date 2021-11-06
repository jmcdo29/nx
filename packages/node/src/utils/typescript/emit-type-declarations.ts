import { getTsConfig } from './get-ts-config';
import * as path from 'path';
import { getFormattedDiagnostic } from './run-type-check';

export async function emitTypeDeclarations(
  ts: typeof import('typescript'),
  baseDir: string,
  tsConfigPath: string,
  outDir: string,
  cacheDir?: string
) {
  const [parsedCommandLine, compilerOptions] = getTsConfig(
    ts,
    baseDir,
    tsConfigPath,
    {
      emitDeclarationOnly: true,
      declaration: true,
      outDir,
    }
  );

  let program:
    | import('typescript').Program
    | import('typescript').BuilderProgram;
  let incremental = false;
  if (compilerOptions.incremental && cacheDir) {
    incremental = true;
    program = ts.createIncrementalProgram({
      rootNames: parsedCommandLine.fileNames,
      options: {
        ...compilerOptions,
        incremental: true,
        tsBuildInfoFile: path.join(cacheDir, '.tsbuildinfo'),
      },
    });
  } else {
    program = ts.createProgram(parsedCommandLine.fileNames, compilerOptions);
  }
  const result = program.emit();

  const allDiagnostics = ts
    .getPreEmitDiagnostics(program as import('typescript').Program)
    .concat(result.diagnostics);

  const errors = await Promise.all(
    allDiagnostics
      .filter((d) => d.category === ts.DiagnosticCategory.Error)
      .map((d) => getFormattedDiagnostic(ts, baseDir, d))
  );

  const warnings = await Promise.all(
    allDiagnostics
      .filter((d) => d.category === ts.DiagnosticCategory.Warning)
      .map((d) => getFormattedDiagnostic(ts, baseDir, d))
  );

  return {
    warnings,
    errors,
    inputFilesCount: parsedCommandLine.fileNames.length,
    totalFilesCount: program.getSourceFiles().length,
    incremental,
    result,
  };
}
