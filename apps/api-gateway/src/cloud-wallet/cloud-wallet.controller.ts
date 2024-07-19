import { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Controller, Post, Logger, Body, HttpStatus, Res, UseFilters, UseGuards, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
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
import { UserRoleGuard } from '../authz/guards/user-role.guard';
import { AcceptProofRequestDto } from './dtos/accept-proof-request.dto';
import { IGetProofPresentation, IGetProofPresentationById } from '@credebl/common/interfaces/cloud-wallet.interface';


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

        const { id, email } = user;

        cloudBaseWalletConfigure.userId = id;
        cloudBaseWalletConfigure.email = email;

        const configureBaseWalletData = await this.cloudWalletService.configureBaseWallet(cloudBaseWalletConfigure);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.cloudWallet.success.configureBaseWallet,
            data: configureBaseWalletData
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
        * Accept proof request 
        * @param acceptProofRequest
        * @param user 
        * @param res 
        * @returns sucess message
    */
    @Post('/proofs/accept-request')
    @ApiOperation({ summary: 'Accept proof request', description: 'Accept proof request' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    @UseGuards(AuthGuard('jwt'), UserRoleGuard)
    async acceptProofRequest(
        @Res() res: Response,
        @Body() acceptProofRequest: AcceptProofRequestDto,
        @User() user: user
    ): Promise<Response> {
        const { id, email } = user;
        acceptProofRequest.userId = id;
        acceptProofRequest.email = email;

        const acceptProofRequestDetails = await this.cloudWalletService.acceptProofRequest(acceptProofRequest);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.cloudWallet.success.acceptProofRequest,
            data: acceptProofRequestDetails
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

    /**
        * Get proof presentation by proof id
        * @param proofRecordId 
        * @param res 
        * @returns sucess message
    */
    @Get('/proofs/:proofRecordId')
    @ApiOperation({ summary: 'Get proof presentation by Id', description: 'Get proof presentation by Id' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @UseGuards(AuthGuard('jwt'), UserRoleGuard)
    async getProofById(
        @Param('proofRecordId') proofRecordId: string,
        @Res() res: Response,
        @User() user: user
    ): Promise<Response> {
        const { id, email } = user;

        const proofPresentationByIdPayload: IGetProofPresentationById = {
            userId: id,
            email,
            proofRecordId
        };

        const getProofDetails = await this.cloudWalletService.getProofById(proofPresentationByIdPayload);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.cloudWallet.success.getProofById,
            data: getProofDetails
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
        * Get proof presentations
        * @param threadId 
        * @param res 
        * @returns sucess message
    */
    @Get('/proofs')
    @ApiOperation({ summary: 'Get proof presentation', description: 'Get proof presentation' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @UseGuards(AuthGuard('jwt'), UserRoleGuard)
    @ApiQuery({
        name: 'threadId',
        required: false
    })
    async getProofPresentation(
        @Res() res: Response,
        @User() user: user,
        @Query('threadId') threadId?: string
    ): Promise<Response> {

        const { id, email } = user;

        const proofPresentationPayload: IGetProofPresentation = {
            userId: id,
            email,
            threadId
        };

        const getProofDetails = await this.cloudWalletService.getProofPresentation(proofPresentationPayload);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.cloudWallet.success.getProofPresentation,
            data: getProofDetails
        };
        return res.status(HttpStatus.OK).json(finalResponse);
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
