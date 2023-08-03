import { IUserRequestInterface } from './IUserRequestInterface';

export interface FileExportResponse {
    fileContent: string;
    fileName : string
}

export interface FileImportRequest {
    filePath: string;
    fileName : string;
    credDefId: string;
    user : IUserRequestInterface
}