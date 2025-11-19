/* eslint-disable no-param-reassign */
/* eslint-disable camelcase */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller,
  Logger,
  Post,
  UseGuards,
  BadRequestException,
  Body,
  HttpStatus,
  Res,
  Get,
  UseFilters,
  Param,
  Delete,
  ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,  
  ApiBody,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { AgentService } from './agent-service.service';
import IResponseType, { IResponse } from '@credebl/common/interfaces/response.interface';
import { AgentSpinupDto, IVerifySignature, SignDataDto, VerifySignatureDto } from './dto/agent-service.dto';
import { Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { User } from '../authz/decorators/user.decorator';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { validateDid } from '@credebl/common/did.validator';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CreateNewDidDto } from './dto/create-new-did.dto';
import { AgentSpinupValidator, TrimStringParamPipe } from '@credebl/common/cast.helper';
import { AgentConfigureDto } from './dto/agent-configure.dto';

const seedLength = 32;

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('agents')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class AgentController {
  constructor(private readonly agentService: AgentService) {}
  private readonly logger = new Logger();

  /**
   * Get Organization agent health
   * @param orgId
   * @param reqUser
   * @param res
   * @returns Get agent details
   */
  @Get('/orgs/:orgId/agents/health')
  @ApiOperation({
    summary: 'Get the agent health details',
    description: 'Get the agent health details'
  })
  @UseGuards(AuthGuard('jwt'))
  async getAgentHealth(@Param('orgId') orgId: string, @User() reqUser: user, @Res() res: Response): Promise<Response> {
    const agentData = await this.agentService.getAgentHealth(reqUser, orgId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.health,
      data: agentData
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/agents/ledgerConfig')
  @ApiOperation({
    summary: 'Get the ledger config details',
    description: 'Get the ledger config details'
  })
  @UseGuards(AuthGuard('jwt'))
  async getLedgerDetails(@User() reqUser: user, @Res() res: Response): Promise<Response> {
    const ledgerConfigData = await this.agentService.getLedgerConfig(reqUser);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.ledgerConfig,
      data: ledgerConfigData
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Spinup the agent by organization
   * @param agentSpinupDto
   * @param user
   * @returns Get agent status
   */
  @Post('/orgs/:orgId/agents/spinup')
  @ApiOperation({
    summary: 'Agent spinup',
    description: 'Create a new agent spin up.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async agentSpinup(
    @Param('orgId') orgId: string,
    @Body() agentSpinupDto: AgentSpinupDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    AgentSpinupValidator.validate(agentSpinupDto);
    this.logger.log(`**** Spin up the agent...${JSON.stringify(agentSpinupDto)}`);

    agentSpinupDto.orgId = orgId;
    const agentDetails = await this.agentService.agentSpinup(agentSpinupDto, user);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.create,
      data: agentDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Create wallet for shared agent
   * @param orgId
   * @param createTenantDto
   * @param user
   * @param res
   * @returns wallet initialization status
   */
  @Post('/orgs/:orgId/agents/wallet')
  @ApiOperation({
    summary: 'Shared Agent',
    description: 'Create a shared agent.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async createTenant(
    @Param('orgId') orgId: string,
    @Body() createTenantDto: CreateTenantDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    createTenantDto.orgId = orgId;

    const tenantDetails = await this.agentService.createTenant(createTenantDto, user);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.create,
      data: tenantDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Create wallet
   * @param orgId
   * @returns wallet
   */
  @Post('/orgs/:orgId/agents/createWallet')
  @ApiOperation({
    summary: 'Create wallet',
    description: 'Create wallet'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async createWallet(
    @Param('orgId') orgId: string,
    @Body() createWalletDto: CreateWalletDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    createWalletDto.orgId = orgId;
    const walletDetails = await this.agentService.createWallet(createWalletDto, user);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.createWallet,
      data: walletDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  // This function will be used after multiple did method implementation in create wallet
  /**
   * Create did
   * @param orgId
   * @returns did
   */
  @Post('/orgs/:orgId/agents/did')
  @ApiOperation({
    summary: 'Create new did',
    description: 'Create new did for an organization'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async createDid(
    @Param('orgId') orgId: string,
    @Body() createDidDto: CreateNewDidDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    await validateDid(createDidDto);

    if (createDidDto.seed && seedLength !== createDidDto.seed.length) {
      this.logger.error(`seed must be at most 32 characters.`);
      throw new BadRequestException(ResponseMessages.agent.error.seedChar, {
        cause: new Error(),
        description: ResponseMessages.errorMessages.badRequest
      });
    }
    const didDetails = await this.agentService.createDid(createDidDto, orgId, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.createDid,
      data: didDetails
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Create Secp256k1 key pair for polygon DID
   * @param orgId
   * @returns Secp256k1 key pair for polygon DID
   */
  @Post('/orgs/:orgId/agents/polygon/create-keys')
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.PLATFORM_ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async createSecp256k1KeyPair(@Param('orgId') orgId: string, @Res() res: Response): Promise<Response> {
    const didDetails = await this.agentService.createSecp256k1KeyPair(orgId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.createKeys,
      data: didDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Create 
   * @param orgId
   * @returns Secp256k1 key pair for polygon DID
   */
  @Post('/orgs/:orgId/agents/ethereum/create-keys')
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.PLATFORM_ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async createEthKeyPair(@Param('orgId') orgId: string, @Res() res: Response): Promise<Response> {
    const didDetails = await this.agentService.createEthKeyPair(orgId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.createKeys,
      data: didDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Configure the agent by organization
   * @param agentSpinupDto
   * @param user
   * @returns Get agent status
   */
  @Post('/orgs/:orgId/agents/configure')
  @ApiOperation({
    summary: 'Agent configure',
    description: 'Create a new agent configure.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  async agentConfigure(
    @Param('orgId') orgId: string,
    @Body() agentConfigureDto: AgentConfigureDto,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    this.logger.log(`**** Configure the agent...${JSON.stringify(agentConfigureDto)}`);

    agentConfigureDto.orgId = orgId;
    const agentDetails = await this.agentService.agentConfigure(agentConfigureDto, user);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.agent.success.create,
      data: agentDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Delete('/orgs/:orgId/agents/wallet')
  @ApiOperation({
    summary: 'Delete wallet',
    description: 'Delete agent wallet by organization.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER)
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async deleteWallet(
    @Param('orgId', TrimStringParamPipe, new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }})) orgId: string, 
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    await this.agentService.deleteWallet(orgId, user);

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.walletDelete
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Sign data from agent
   * @param orgId The ID of the organization
   * @param reqUser The user making the request
   * @param res The response object
   * @returns Get agent details
   */
  @ApiBody({
    description:
      'Enter the data you would like to sign. It can be of type w3c jsonld credential or any type that needs to be signed',
    type: SignDataDto,
    required: true
  })
  @Post('/orgs/:orgId/agents/sign')
  @ApiOperation({
    summary: 'Signs data from agent',
    description: 'Signs data from agent'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(
    OrgRoles.OWNER,
    OrgRoles.ADMIN,
    OrgRoles.HOLDER,
    OrgRoles.ISSUER,
    OrgRoles.SUPER_ADMIN,
    OrgRoles.MEMBER,
    OrgRoles.VERIFIER
  )
  async signData(@Param('orgId') orgId: string, @Body() data: SignDataDto, @Res() res: Response): Promise<Response> {
    const agentData = await this.agentService.signData(data, orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.sign,
      data: agentData
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get Organization agent health
   * @param orgId The ID of the organization
   * @param reqUser The user making the request
   * @param res The response object
   * @returns Get agent details
   */
  @ApiBody({
    type: VerifySignatureDto,
    description:
      'Enter the data you would like to verify the signature for. It can be of type w3c jsonld credential or any type that needs to be verified'
  })
  @Post('/orgs/:orgId/agents/verify-signature')
  @ApiOperation({
    summary: 'Validates signed data from agent, including credentials',
    description: 'Credentials or any other data signed by the organization is validated'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(
    OrgRoles.OWNER,
    OrgRoles.ADMIN,
    OrgRoles.HOLDER,
    OrgRoles.ISSUER,
    OrgRoles.SUPER_ADMIN,
    OrgRoles.MEMBER,
    OrgRoles.VERIFIER
  )
  async verifySignature(
    @Param('orgId') orgId: string,
    @Body() data: IVerifySignature,
    @Res() res: Response
  ): Promise<Response> {
    this.logger.log(`[verifySignature] - verifying signature for orgId: ${orgId} with data ${JSON.stringify(data)}`);
    const agentData = await this.agentService.verifySignature(data, orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.verify,
      data: agentData
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

}
