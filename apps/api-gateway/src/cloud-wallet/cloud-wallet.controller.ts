import { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Controller, Post, Logger, Body, HttpStatus, Res, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { CloudWalletService } from './cloud-wallet.service';
import { CreateCloudWalletDto } from './dtos/cloudWallet.dto';
import { Response } from 'express';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { CloudBaseWalletConfigureDto } from './dtos/configure-base-wallet.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';


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
        * Configure cloud base wallet 
        * @param cloudBaseWalletConfigure
        * @param user 
        * @param res 
        * @returns sucess message
    */
    @Post('/configure/base-wallet')
    @ApiOperation({ summary: 'Configure base wallet', description: 'Configure base wallet' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    @UseGuards(AuthGuard('jwt'))
    async configureBaseWallet(
        @Res() res: Response,
        @Body() cloudBaseWalletConfigure: CloudBaseWalletConfigureDto,
        @User() user: user
    ): Promise<Response> {

        const configureBaseWalletData = await this.cloudWalletService.configureBaseWallet(cloudBaseWalletConfigure, user);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.cloudWallet.success.configureBaseWallet,
            data: configureBaseWalletData
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

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
