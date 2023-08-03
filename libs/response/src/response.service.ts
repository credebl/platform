import { Injectable } from '@nestjs/common';

@Injectable()
export class ResponseService {

    message: string;
    data: any;
    success: boolean;
    code: number;

    public response(message: string, success: boolean, data?: any, code?: number): ResponseService {
        // This function should be static so no need to create object in every method not changing code because of 
        // does not know impact of it on how many function and files.
        //Todo: function should be static.
        
        const response: ResponseService = new ResponseService();
        response.message = message;
        response.data = data;
        response.success = success;
        response.code = code;
        return response;
    }
}
