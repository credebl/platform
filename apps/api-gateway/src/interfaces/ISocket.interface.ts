interface IError {
    error: string
}

export interface ISocketInterface {
    token?: string;
    message?: string;
    clientSocketId?: string;
    clientId?: string;
    error?: string | IError;
    connectionId?: string;
    demoFlow?: string;
    fileUploadId?: string;
}