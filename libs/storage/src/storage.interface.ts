// export interface IStorageProvider {
//     uploadFile(buffer: Buffer, key: string, mimeType: string): Promise<string>;
//     getFile(key: string): Promise<Buffer>;
//     deleteFile(key: string): Promise<void>;
//     // eslint-disable-next-line @typescript-eslint/no-explicit-any
//     storeObject(key: string, body: any): Promise<string>;
//   }

export interface FileUploadOptions {
  readonly encoding?: string;
  readonly mimeType: string;
}

export interface IStorageProvider {
  uploadFile(bucket: string, key: string, content: Buffer, options: FileUploadOptions): Promise<string>;

  getFile(bucket: string, key: string): Promise<Buffer>;

  deleteFile(bucket: string, key: string): Promise<void>;

  storeObject(bucket: string, persistent: boolean, key: string, body: unknown): Promise<string>;
}
