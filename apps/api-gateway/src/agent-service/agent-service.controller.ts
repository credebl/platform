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
  ApiForbiddenResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { AgentService } from './agent-service.service';
import IResponseType, { IResponse } from '@credebl/common/interfaces/response.interface';
import { AgentSpinupDto, SignDataDto, VerifySignatureDto } from './dto/agent-service.dto';
import { Response } from 'express';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { user } from '@prisma/client';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { User } from '../authz/decorators/user.decorator';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { Validator } from '@credebl/common/validator';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { CreateNewDidDto } from './dto/create-new-did.dto';
import { AgentSpinupValidator, TrimStringParamPipe } from '@credebl/common/cast.helper';
import { AgentConfigureDto } from './dto/agent-configure.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { IVerifySignature } from './interface/agent-service.interface';

const seedLength = 32;

@UseFilters(CustomExceptionFilter)
@Controller()
@ApiTags('agents')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
export class AgentController {
  constructor(private readonly agentService: AgentService) {}
  private readonly logger = new Logger();

  /**
   * Get Organization agent health
   * @param orgId The ID of the organization
   * @param reqUser The user making the request
   * @param res The response object
   * @returns Get agent details
   */
  @Get('/orgs/:orgId/agents/health')
  @ApiOperation({
    summary: 'Get the agent health details',
    description: 'Get the agent health details for the organization'
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
  async getAgentHealth(@Param('orgId') orgId: string, @User() reqUser: user, @Res() res: Response): Promise<Response> {
    const agentData = await this.agentService.getAgentHealth(reqUser, orgId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.health,
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
    description:
      'Enter the data you would like to verify the signature for. It can be of type w3c jsonld credential or any type that needs to be verified',
    type: VerifySignatureDto
  })
  @Post('/orgs/:orgId/agents/verify-signature')
  @ApiOperation({
    summary: 'Validates signed data from agent, including credentials',
    description: 'Credentials or any other data signed by the organisation is validated'
  })
  // @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  // @Roles(
  //   OrgRoles.OWNER,
  //   OrgRoles.ADMIN,
  //   OrgRoles.HOLDER,
  //   OrgRoles.ISSUER,
  //   OrgRoles.SUPER_ADMIN,
  //   OrgRoles.MEMBER,
  //   OrgRoles.VERIFIER
  // )
  async verifysignature(
    @Param('orgId') orgId: string,
    @Body() data: IVerifySignature,
    @Res() res: Response
  ): Promise<Response> {
    const agentData = await this.agentService.verifysignature(data, orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.agent.success.verify,
      data: agentData
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get the ledger config details
   * @param reqUser The user making the request
   * @param res The response object
   * @returns Ledger config details
   */
  @Get('/orgs/agents/ledgerConfig')
  @ApiOperation({
    summary: 'Get the ledger config details',
    description: 'Get the all supported ledger configuration details for the platform'
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
   * @param agentSpinupDto The details of the agent to be spun up
   * @param user The user making the request
   * @param res The response object
   * @returns Get agent status
   */
  @Post('/orgs/:orgId/agents/spinup')
  @ApiOperation({
    summary: 'Spinup the platform admin agent',
    description: 'Initialize and configure a new platform admin agent for the platform.'
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
   * @param orgId The ID of the organization
   * @param createTenantDto The details of the tenant to be created
   * @param user The user making the request
   * @param res The response object
   * @returns Wallet initialization status
   */
  @Post('/orgs/:orgId/agents/wallet')
  @ApiOperation({
    summary: 'Create Shared Agent Wallet',
    description: 'Initialize and create a shared agent wallet for the organization.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Wallet successfully created', type: ApiResponseDto })
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
   * @param orgId The ID of the organization
   * @param createWalletDto The details of the wallet to be created
   * @param user The user making the request
   * @param res The response object
   * @returns Wallet details
   */
  @Post('/orgs/:orgId/agents/createWallet')
  @ApiOperation({
    summary: 'Create tenant in the agent',
    description: 'Create a new wallet for the organization without storing the wallet details in the platform.'
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

  /**
   * Create did
   * @param orgId The ID of the organization
   * @param createDidDto The details of the DID to be created
   * @param user The user making the request
   * @param res The response object
   * @returns DID details
   */
  @Post('/orgs/:orgId/agents/did')
  @ApiOperation({
    summary: 'Create new DID',
    description: 'Create a new DID for an organization wallet'
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
    Validator.validateDid(createDidDto);

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
   * @param orgId The ID of the organization
   * @param res The response object
   * @returns Secp256k1 key pair for polygon DID
   */
  @Post('/orgs/:orgId/agents/polygon/create-keys')
  @ApiOperation({
    summary: 'Create Secp256k1 key pair for polygon DID',
    description: 'Create Secp256k1 key pair for polygon DID for an organization'
  })
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
   * Configure the agent by organization
   * @param agentConfigureDto The details of the agent configuration
   * @param user The user making the request
   * @param res The response object
   * @returns Agent configuration status
   */
  @Post('/orgs/:orgId/agents/configure')
  @ApiOperation({
    summary: 'Configure the organization agent',
    description: 'Configure the running dedicated agent for the organization using the provided configuration details.'
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

  /**
   * Delete wallet
   * @param orgId The ID of the organization
   * @param user The user making the request
   * @param res The response object
   * @returns Success message
   */
  @Delete('/orgs/:orgId/agents/wallet')
  @ApiOperation({
    summary: 'Delete agent wallet',
    description: 'Delete agent wallet for the organization using orgId.'
  })
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @Roles(OrgRoles.OWNER)
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async deleteWallet(
    @Param(
      'orgId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
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
}
