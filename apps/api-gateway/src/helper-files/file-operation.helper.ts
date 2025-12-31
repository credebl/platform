import { promisify } from 'util';
import * as fs from 'fs';

export const checkIfFileOrDirectoryExists = (path: string): boolean => fs.existsSync(path);

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export const createFile = async (dirPath: string, fileName: string, data: string): Promise<void> => {
  if (!checkIfFileOrDirectoryExists(dirPath)) {
    await mkdir(dirPath, { recursive: true });
  }
  await writeFile(`${dirPath}/${fileName}`, data, 'utf8');
};

export const getFile = async (path: string, encoding: BufferEncoding): Promise<string | Buffer> => {
  const readFile = promisify(fs.readFile);

  return encoding ? readFile(path, { encoding }) : readFile(path, {});
};

export const deleteFile = async (path: string): Promise<void> => {
  const unlink = promisify(fs.unlink);

  return unlink(path);
};
