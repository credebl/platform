import { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Controller, Post, Logger, Body, HttpStatus, Res, UseFilters, UseGuards, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { CloudWalletService } from './cloud-wallet.service';
import { AcceptOfferDto, BasicMessageDTO, CreateCloudWalletDidDto, CreateCloudWalletDto, CredentialListDto, GetAllCloudWalletConnectionsDto, ReceiveInvitationUrlDTO } from './dtos/cloudWallet.dto';
import { Response } from 'express';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { CloudBaseWalletConfigureDto } from './dtos/configure-base-wallet.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';
import { validateDid } from '@credebl/common/did.validator';
import { CommonConstants } from '@credebl/common/common.constant';
import { UserRoleGuard } from '../authz/guards/user-role.guard';
import { AcceptProofRequestDto } from './dtos/accept-proof-request.dto';
import { IBasicMessage, IConnectionDetailsById, ICredentialDetails, IGetProofPresentation, IGetProofPresentationById, IWalletDetailsForDidList } from '@credebl/common/interfaces/cloud-wallet.interface';
import { CreateConnectionDto } from './dtos/create-connection.dto';


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
        * Create cloud wallet
        * @param cloudWalletDetails 
        * @param res 
        * @returns Sucess message and wallet details
    */
     @Post('/create-wallet')
     @ApiOperation({ summary: 'Create cloud wallet', description: 'Create cloud wallet' })
     @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
     @ApiBearerAuth()
     @UseGuards(AuthGuard('jwt'), UserRoleGuard)
     async createCloudWallet(
         @Res() res: Response,
         @Body() cloudWalletDetails: CreateCloudWalletDto,
         @User() user: user
     ): Promise<Response> {
         const {email, id} = user;
         cloudWalletDetails.email = email;
         cloudWalletDetails.userId = id;
         const cloudWalletData = await this.cloudWalletService.createCloudWallet(cloudWalletDetails);
         const finalResponse: IResponse = {
             statusCode: HttpStatus.CREATED,
             message: ResponseMessages.cloudWallet.success.create,
             data: cloudWalletData
         };
         return res.status(HttpStatus.CREATED).json(finalResponse);
 
     }


    /**
        * Accept proof request 
        * @param acceptProofRequest
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
        * Receive invitation by URL
        * @param receiveInvitation 
        * @param res 
        * @returns Response from agent
    */
      @Post('/receive-invitation-url')
      @ApiOperation({ summary: 'Receive inviation using URL', description: 'Receive inviation using URL' })
      @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
      @ApiBearerAuth()
      @UseGuards(AuthGuard('jwt'), UserRoleGuard)
      async receiveInvitationByUrl(
          @Res() res: Response,
          @Body() receiveInvitation: ReceiveInvitationUrlDTO,
          @User() user: user
      ): Promise<Response> {
        const {email, id} = user;
        receiveInvitation.email = email;
        receiveInvitation.userId = id;
          const receiveInvitationData = await this.cloudWalletService.receiveInvitationByUrl(receiveInvitation);
          const finalResponse: IResponse = {
              statusCode: HttpStatus.CREATED,
              message: ResponseMessages.cloudWallet.success.receive,
              data: receiveInvitationData
          };
          return res.status(HttpStatus.CREATED).json(finalResponse);
  
      }

      /**
        * Accept offer
        * @param acceptOffer 
        * @param res 
        * @returns Response from agent
    */
      @Post('/accept-offer')
      @ApiOperation({ summary: 'Accept credential offer', description: 'Accept credential offer' })
      @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
      @ApiBearerAuth()
      @UseGuards(AuthGuard('jwt'), UserRoleGuard)
      async acceptOffer(
          @Res() res: Response,
          @Body() acceptOffer: AcceptOfferDto,
          @User() user: user
      ): Promise<Response> {
        const {email, id} = user;
        acceptOffer.email = email;
        acceptOffer.userId = id;
          const receiveInvitationData = await this.cloudWalletService.acceptOffer(acceptOffer);
          const finalResponse: IResponse = {
              statusCode: HttpStatus.CREATED,
              message: ResponseMessages.cloudWallet.success.receive,
              data: receiveInvitationData
          };
          return res.status(HttpStatus.CREATED).json(finalResponse);
  
      }

  /**
   * Create did
   * @param orgId
   * @returns did
   */
  @Post('/did')
  @ApiOperation({
    summary: 'Create new did',
    description: 'Create new did for cloud wallet'
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async createDid(
    @Body() createDidDto: CreateCloudWalletDidDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    await validateDid(createDidDto);
    const {email, id} = user;
    createDidDto.email = email;
    createDidDto.userId = id;
    if (createDidDto.seed && CommonConstants.SEED_LENGTH !== createDidDto.seed.length) {
      throw new BadRequestException(ResponseMessages.agent.error.seedChar, {
        cause: new Error(),
        description: ResponseMessages.errorMessages.badRequest
      });
    }

    const didDetails = await this.cloudWalletService.createDid(createDidDto);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.createDid,
      data: didDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

   /**
        * Get DID list by tenant id
        * @param tenantId 
        * @param res 
        * @returns DID list
    */
   @Get('/did')
   @ApiOperation({ summary: 'Get DID list from wallet', description: 'Get DID list from wallet' })
   @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
   @UseGuards(AuthGuard('jwt'), UserRoleGuard)
   async getDidList(
       @Res() res: Response,
       @User() user: user
   ): Promise<Response> {
       const { id, email } = user;

       const walletDetails: IWalletDetailsForDidList = {
           userId: id,
           email
       };

       const didListDetails = await this.cloudWalletService.getDidList(walletDetails);
       const finalResponse: IResponse = {
           statusCode: HttpStatus.OK,
           message: ResponseMessages.cloudWallet.success.didList,
           data: didListDetails
       };
       return res.status(HttpStatus.OK).json(finalResponse);
   }

   /**
        * Accept proof request 
        * @param CreateConnectionDto
        * @returns sucess message
    */
   @Post('/connections/invitation')
   @ApiOperation({ summary: 'Create connection invitation for cloud wallet', description: 'Create connection invitation' })
   @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
   @UseGuards(AuthGuard('jwt'), UserRoleGuard)
   async createConnection(
       @Res() res: Response,
       @Body() createConnection: CreateConnectionDto,
       @User() user: user
   ): Promise<Response> {
       const { id, email } = user;
       createConnection.userId = id;
       createConnection.email = email;

       const createConnectionDetails = await this.cloudWalletService.createConnection(createConnection);
       const finalResponse: IResponse = {
           statusCode: HttpStatus.CREATED,
           message: ResponseMessages.cloudWallet.success.createConnection,
           data: createConnectionDetails
       };
       return res.status(HttpStatus.CREATED).json(finalResponse);
   }

   /**
        * Get connection list by tenant id and connection id
        * @param tenantId 
        * @param connectionId 
        * @param res 
        * @returns DID list
    */
   @Get('/connection/:connectionId')
   @ApiOperation({ summary: 'Get connection by connection Id', description: 'Get connection by connection Id' })
   @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
   @UseGuards(AuthGuard('jwt'), UserRoleGuard)
   async getconnectionById(
       @Param('connectionId') connectionId: string,
       @Res() res: Response,
       @User() user: user
   ): Promise<Response> {
       const { id, email } = user;

       const connectionDetails: IConnectionDetailsById = {
           userId: id,
           email,
           connectionId
       };

       const connectionDetailResponse = await this.cloudWalletService.getconnectionById(connectionDetails);
       const finalResponse: IResponse = {
           statusCode: HttpStatus.OK,
           message: ResponseMessages.cloudWallet.success.connectionById,
           data: connectionDetailResponse
       };
       return res.status(HttpStatus.OK).json(finalResponse);
   }

   /**
        * Get connection list by tenant id
        * @param res 
        * @returns DID list
    */
   @Get('/connections')
   @ApiOperation({ summary: 'Get all wallet connections', description: 'Get all wallet connections' })
   @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
   @UseGuards(AuthGuard('jwt'), UserRoleGuard)
   async getAllconnectionById(
       @Query() connectionListQueryOptions: GetAllCloudWalletConnectionsDto,
       @Res() res: Response,
       @User() user: user
   ): Promise<Response> {
       const { id, email } = user;
 
       connectionListQueryOptions.userId = id;
       connectionListQueryOptions.email = email;

       const connectionDetailResponse = await this.cloudWalletService.getAllconnectionById(connectionListQueryOptions);
       const finalResponse: IResponse = {
           statusCode: HttpStatus.OK,
           message: ResponseMessages.cloudWallet.success.connectionList,
           data: connectionDetailResponse
       };
       return res.status(HttpStatus.OK).json(finalResponse);
   }

    /**
        * Get credential list by tenant id
        * @param credentialListQueryOptions 
        * @param res 
        * @returns Credential list
    */
    @Get('/credential')
    @ApiOperation({ summary: 'Get credential list from cloud wallet', description: 'Get credential list from cloud wallet' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @UseGuards(AuthGuard('jwt'), UserRoleGuard)
    async getCredentialList(
        @Query() credentialListQueryOptions: CredentialListDto,
        @Res() res: Response,
        @User() user: user
    ): Promise<Response> {
        const { id, email } = user;
 
        credentialListQueryOptions.userId = id;
        credentialListQueryOptions.email = email;
 
        const connectionDetailResponse = await this.cloudWalletService.getCredentialList(credentialListQueryOptions);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.cloudWallet.success.credentials,
            data: connectionDetailResponse
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
        * Get credential list by tenant id
        * @param credentialListQueryOptions 
        * @param res 
        * @returns Credential list
    */
    @Get('/credential/:credentialRecordId')
    @ApiOperation({ summary: 'Get credential by credential record Id', description: 'Get credential by credential record Id' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @UseGuards(AuthGuard('jwt'), UserRoleGuard)
    async getCredentialByCredentialRecordId(
        @Param('credentialRecordId') credentialRecordId: string,
        @Res() res: Response,
        @User() user: user
    ): Promise<Response> {
        const { id, email } = user;
 
        const credentialDetails: ICredentialDetails = {
            userId: id,
            email,
            credentialRecordId
        };

        const connectionDetailResponse = await this.cloudWalletService.getCredentialByCredentialRecordId(credentialDetails);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.cloudWallet.success.credentialByRecordId,
            data: connectionDetailResponse
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
        * Get basic-message by connection id
        * @param connectionId 
        * @param res 
        * @returns Credential list
    */
    @Get('/basic-message/:connectionId')
    @ApiOperation({ summary: 'Get basic message by connection id', description: 'Get basic message by connection id' })
    @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
    @UseGuards(AuthGuard('jwt'), UserRoleGuard)
    async getBasicMessageByConnectionId(
        @Param('connectionId') connectionId: string,
        @Res() res: Response,
        @User() user: user
    ): Promise<Response> {
        const { id, email } = user;
 
        const connectionDetails: IBasicMessage = {
            userId: id,
            email,
            connectionId
        };

        const basicMessageDetailResponse = await this.cloudWalletService.getBasicMessageByConnectionId(connectionDetails);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.OK,
            message: ResponseMessages.cloudWallet.success.basicMessageByConnectionId,
            data: basicMessageDetailResponse
        };
        return res.status(HttpStatus.OK).json(finalResponse);
    }

    /**
        * Get basic-message by connection id
        * @param credentialListQueryOptions 
        * @param res 
        * @returns Credential list
    */
    @Post('/basic-message/:connectionId')
    @ApiOperation({ summary: 'send question', description: 'send question' })
    @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
    @UseGuards(AuthGuard('jwt'), UserRoleGuard)
    async sendBasicMessage(
        @Param('connectionId') connectionId: string,
        @Res() res: Response,
        @Body() messageDetails: BasicMessageDTO,
        @User() user: user
    ): Promise<Response> {
        const { id, email } = user;
        messageDetails.userId = id;
        messageDetails.email = email;
        messageDetails.connectionId = connectionId;
        const basicMessageDetails = await this.cloudWalletService.sendBasicMessage(messageDetails);
        const finalResponse: IResponse = {
            statusCode: HttpStatus.CREATED,
            message: ResponseMessages.cloudWallet.success.basicMessage,
            data: basicMessageDetails
        };
        return res.status(HttpStatus.CREATED).json(finalResponse);
    }

}
