import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type {
  CompilerOptions,
  ParseConfigHost,
  ParsedCommandLine,
} from 'typescript';

export function getTsConfig(
  ts: typeof import('typescript'),
  baseDir: string,
  tsConfigPath: string,
  partialOptions: Pick<
    CompilerOptions,
    'noEmit' | 'emitDeclarationOnly' | 'declaration' | 'outDir'
  > = {}
): [ParsedCommandLine, CompilerOptions] {
  const config = ts.readConfigFile(tsConfigPath, ts.sys.readFile);
  if (config.error) {
    throw new Error('Oops');
  }

  const parseConfigHost: ParseConfigHost = {
    fileExists: existsSync,
    readDirectory: ts.sys.readDirectory,
    readFile: (file) => readFileSync(file, 'utf8'),
    useCaseSensitiveFileNames: true,
  };
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    parseConfigHost,
    resolve(baseDir),
    partialOptions
  );

  return [
    parsed,
    {
      ...parsed.options,
      ...partialOptions,
    },
  ];
}
