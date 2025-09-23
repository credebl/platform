import { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import {
  Controller,
  Post,
  Logger,
  Body,
  HttpStatus,
  Res,
  UseFilters,
  UseGuards,
  Get,
  Param,
  Query,
  BadRequestException
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { CloudWalletService } from './cloud-wallet.service';
import {
  AcceptOfferDto,
  BasicMessageDTO,
  CreateCloudWalletDidDto,
  CreateCloudWalletDto,
  CredentialListDto,
  GetAllCloudWalletConnectionsDto,
  ReceiveInvitationUrlDTO
} from './dtos/cloudWallet.dto';
import { Response } from 'express';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { CloudBaseWalletConfigureDto } from './dtos/configure-base-wallet.dto';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';
import { Validator } from '@credebl/common/validator';
import { CommonConstants } from '@credebl/common/common.constant';
import { UserRoleGuard } from '../authz/guards/user-role.guard';
import { AcceptProofRequestDto } from './dtos/accept-proof-request.dto';
import {
  IBasicMessage,
  IConnectionDetailsById,
  ICredentialDetails,
  IGetProofPresentation,
  IGetProofPresentationById,
  IWalletDetailsForDidList
} from '@credebl/common/interfaces/cloud-wallet.interface';
import { CreateConnectionDto } from './dtos/create-connection.dto';

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('cloud-wallet')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
export class CloudWalletController {
  private readonly logger = new Logger('cloud-wallet');
  constructor(private readonly cloudWalletService: CloudWalletService) {}

  /**
   * Configure cloud base wallet
   * @param cloudBaseWalletConfigure
   * @param user
   * @param res
   * @returns success message
   */
  @Post('/configure/base-wallet')
  @ApiOperation({
    summary: 'Configure Cloud Base Wallet',
    description: 'Endpoint to configure the base wallet for the cloud wallet service.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Base wallet configured successfully', type: ApiResponseDto })
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
   * @returns Success message and wallet details
   */
  @Post('/create-wallet')
  @ApiOperation({ summary: 'Create Cloud Wallet', description: 'Endpoint to create a new cloud wallet for the user.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Cloud wallet created successfully', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  async createCloudWallet(
    @Res() res: Response,
    @Body() cloudWalletDetails: CreateCloudWalletDto,
    @User() user: user
  ): Promise<Response> {
    const { email, id } = user;
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
   * @returns success message
   */
  @Post('/proofs/accept-request')
  @ApiOperation({
    summary: 'Accept Proof Request',
    description: 'Endpoint to accept a proof request for the cloud wallet.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Proof request accepted successfully', type: ApiResponseDto })
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
   * @returns success message
   */
  @Get('/proofs/:proofRecordId')
  @ApiOperation({
    summary: 'Get Proof Presentation by ID',
    description: 'Endpoint to retrieve proof presentation details by proof record ID.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Proof presentation retrieved successfully',
    type: ApiResponseDto
  })
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
   * @returns success message
   */
  @Get('/proofs')
  @ApiOperation({
    summary: 'Get Proof Presentations',
    description: 'Endpoint to retrieve all proof presentations, optionally filtered by thread ID.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Proof presentations retrieved successfully',
    type: ApiResponseDto
  })
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
  @ApiOperation({
    summary: 'Receive Invitation by URL',
    description: 'Endpoint to receive an invitation using a URL for the cloud wallet.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Invitation received successfully', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  async receiveInvitationByUrl(
    @Res() res: Response,
    @Body() receiveInvitation: ReceiveInvitationUrlDTO,
    @User() user: user
  ): Promise<Response> {
    const { email, id } = user;
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
  @ApiOperation({
    summary: 'Accept Credential Offer',
    description: 'Endpoint to accept a credential offer for the cloud wallet.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Credential offer accepted successfully',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  async acceptOffer(@Res() res: Response, @Body() acceptOffer: AcceptOfferDto, @User() user: user): Promise<Response> {
    const { email, id } = user;
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
   * @param createDidDto
   * @param res
   * @returns did
   */
  @Post('/did')
  @ApiOperation({
    summary: 'Create DID',
    description: 'Endpoint to create a new DID (Decentralized Identifier) for the cloud wallet.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'DID created successfully', type: ApiResponseDto })
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  async createDid(
    @Body() createDidDto: CreateCloudWalletDidDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    Validator.validateDid(createDidDto);
    const { email, id } = user;
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
   * Get DID list by organization id
   * @param res
   * @returns DID list
   */
  @Get('/did')
  @ApiOperation({
    summary: 'Get DID List',
    description: 'Endpoint to retrieve the list of DIDs associated with the cloud wallet.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'DID list retrieved successfully', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'), UserRoleGuard)
  async getDidList(@Res() res: Response, @User() user: user): Promise<Response> {
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
   * Create connection invitation
   * @param createConnection
   * @param res
   * @returns success message
   */
  @Post('/connections/invitation')
  @ApiOperation({
    summary: 'Create Connection Invitation',
    description: 'Endpoint to create a connection invitation for the cloud wallet.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Connection invitation created successfully',
    type: ApiResponseDto
  })
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
   * Get connection by connection id
   * @param connectionId
   * @param res
   * @returns connection details
   */
  @Get('/connection/:connectionId')
  @ApiOperation({
    summary: 'Get Connection by ID',
    description: 'Endpoint to retrieve connection details by connection ID.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connection details retrieved successfully',
    type: ApiResponseDto
  })
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
   * Get all wallet connections
   * @param connectionListQueryOptions
   * @param res
   * @returns connection list
   */
  @Get('/connections')
  @ApiOperation({
    summary: 'Get All Wallet Connections',
    description: 'Endpoint to retrieve all connections associated with the cloud wallet.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Connections retrieved successfully', type: ApiResponseDto })
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
  @ApiOperation({
    summary: 'Get Credential List',
    description: 'Endpoint to retrieve the list of credentials associated with the cloud wallet.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Credential list retrieved successfully', type: ApiResponseDto })
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
   * Get credential by credential record id
   * @param credentialRecordId
   * @param res
   * @returns Credential details
   */
  @Get('/credential/:credentialRecordId')
  @ApiOperation({
    summary: 'Get Credential by Record ID',
    description: 'Endpoint to retrieve credential details by credential record ID.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credential details retrieved successfully',
    type: ApiResponseDto
  })
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
   * Get basic message by connection id
   * @param connectionId
   * @param res
   * @returns Basic message details
   */
  @Get('/basic-message/:connectionId')
  @ApiOperation({
    summary: 'Get Basic Message by Connection ID',
    description: 'Endpoint to retrieve basic message details by connection ID.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Basic message details retrieved successfully',
    type: ApiResponseDto
  })
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
   * Send basic message
   * @param connectionId
   * @param messageDetails
   * @param res
   * @returns success message
   */
  @Post('/basic-message/:connectionId')
  @ApiOperation({ summary: 'Send Basic Message', description: 'Endpoint to send a basic message to a connection.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Basic message sent successfully', type: ApiResponseDto })
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
