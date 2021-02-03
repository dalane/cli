import { exists, stat, PathLike, readFile as fsReadfile, Stats } from 'fs';
import { promisify } from 'util';
import { resolve } from 'path';
import { homedir } from 'os';
import { parse } from "jsonc-parser";

export async function loadJsonFile(path: string): Promise<any> {
  const normalisedConfigFilePath = normalisePath(path);
  let contents = await readFile(normalisedConfigFilePath);
  if (contents instanceof Buffer) {
    contents = contents.toString('utf8');
  }
  return parse(contents);
}

/**
 * if the path begins with a "." the we will assume that the path is relative to
 * the given CWD, if the path begins with "~" we will assume that it is relative
 * to the homedirectory and create a full path based from the CWD
 */
export function normalisePath(inputPath: string, base?: string): string {
  switch (inputPath.substr(0, 1)) {
    case '/': {
      return inputPath;
    }
    case '.': {
      return (undefined === base) ? normalizePathToCwd(inputPath) : normalizePathToSpecifiedDir(inputPath, base);
    }
    case '~': {
      return normalizePathToHomeDir(inputPath);
    }
    default: {
      return inputPath;
    }
  }
};

function normalizePathToCwd(path: string): string {
  return resolve(process.cwd(), path);
}

function normalizePathToHomeDir(path: string): string {
  // remove the ~/ from the start of the path so that it can be joined properly
  if (path.startsWith('~/')) {
    path = path.slice(2);
  }
  return resolve(homedir(), path);
};

function normalizePathToSpecifiedDir(path: string, base: string): string {
  return resolve(base, path);
}

async function readFile(path: string, encoding?: BufferEncoding): Promise<string|Buffer> {
  const readFileAsync = promisify(fsReadfile);
  if (await isNotValidPath(path)) {
    throw new Error(`The path "${path}" not valid`);
  }
  if (await isNotFile(path)) {
    throw new Error(`The path "${path}" does not refer to a file`);
  }
  return readFileAsync(path, {
    encoding
  });
}


async function isValidPath(path: string): Promise<boolean> {
  return await promisify(exists)(path);
}

async function isNotValidPath(path: string): Promise<boolean> {
  return !(await isValidPath(path));
}

async function isFile(path: string): Promise<boolean> {
  if (false === (await isValidPath(path))) {
    return false;
  }
  const stats: Stats = await status(path);
  return (stats && stats.isFile());
};

async function isNotFile(path: string): Promise<boolean> {
  return !(await isFile(path));
}

async function status (path: PathLike): Promise<Stats> {
  return promisify(stat)(path);
}
