import { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Controller, Post, Logger, Body, HttpStatus, Res, UseFilters } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { CloudWalletService } from './cloud-wallet.service';
import { CreateCloudWalletDto } from './dtos/cloudWallet.dto';
import { Response } from 'express';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ApiResponseDto } from '../dtos/apiResponse.dto';

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('cloud-wallet')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class CloudWalletController {

    private readonly logger = new Logger('cloud-wallet');
    constructor(private readonly cloudWalletService: CloudWalletService
    ) { }

     /**
        * Create cloud wallet
        * @param cloudWalletDetails 
        * @param res 
        * @returns sucess message
    */
     @Post('/create-wallet')
     @ApiOperation({ summary: 'Create outbound out-of-band connection invitation', description: 'Create outbound out-of-band connection invitation' })
     @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
     async createCloudWallet(
         @Res() res: Response,
         @Body() cloudWalletDetails: CreateCloudWalletDto
     ): Promise<Response> {
 
         const cloudWalletData = await this.cloudWalletService.createCloudWallet(cloudWalletDetails);
         const finalResponse: IResponse = {
             statusCode: HttpStatus.CREATED,
             message: ResponseMessages.cloudWallet.success.create,
             data: cloudWalletData
         };
         return res.status(HttpStatus.CREATED).json(finalResponse);
 
     }
}
