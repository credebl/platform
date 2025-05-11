import { promisify } from "util";
import * as fs from "fs";


export const createFile = async (
    path: string,
    fileName: string,
    data: string
  ): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    if (!checkIfFileOrDirectoryExists(path)) {
    
      fs.mkdirSync(path);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const writeFile = promisify(fs.writeFile);
    return fs.writeFileSync(`${path}/${fileName}`, data, 'utf8');
  };

  export const checkIfFileOrDirectoryExists = (path: string): boolean => fs.existsSync(path);
  
  export const getFile = async (
    path: string,
    encoding: BufferEncoding
  ): Promise<string | Buffer> => {
    const readFile = promisify(fs.readFile);
  
    return encoding ? readFile(path, {encoding}) : readFile(path, {});
  };


  export const deleteFile = async (path: string): Promise<void> => {
    const unlink = promisify(fs.unlink);
  
    return unlink(path);
  };