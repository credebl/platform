import { Controller, Logger, Post, Body, UseGuards, Get, Query, HttpStatus, Res, Param, UseFilters, ParseUUIDPipe, BadRequestException } from '@nestjs/common';
import { CredentialDefinitionService } from './credential-definition.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse } from '@nestjs/swagger';
import { ApiResponseDto } from 'apps/api-gateway/src/dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from 'apps/api-gateway/src/dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from 'apps/api-gateway/src/dtos/forbidden-error.dto';
import { User } from '../authz/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import { IResponse } from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Response } from 'express';
import { GetAllCredDefsDto } from './dto/get-all-cred-defs.dto';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { IUserRequestInterface } from '../interfaces/IUserRequestInterface';
import { CreateCredentialDefinitionDto } from './dto/create-cred-defs.dto';
import { OrgRoles } from 'libs/org-roles/enums';
import { Roles } from '../authz/decorators/roles.decorator';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { TrimStringParamPipe } from '@credebl/common/cast.helper';


@ApiBearerAuth()
@ApiTags('credential-definitions')
@Controller()
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
@UseFilters(CustomExceptionFilter)
export class CredentialDefinitionController {

  constructor(private readonly credentialDefinitionService: CredentialDefinitionService) { }
  private readonly logger = new Logger('CredentialDefinitionController');

  @Get('/orgs/:orgId/cred-defs/:credDefId')
  @ApiOperation({
    summary: 'Get credential definition by credential definition Id',
    description: 'Get credential definition details by credential definition Id'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getCredentialDefinitionById(
    @Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }})) orgId: string,
    @Param('credDefId') credentialDefinitionId: string,
    @Res() res: Response
  ): Promise<Response> {
    const credentialsDefinitionDetails = await this.credentialDefinitionService.getCredentialDefinitionById(credentialDefinitionId, orgId);
    const credDefResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.credentialDefinition.success.fetch,
      data: credentialsDefinitionDetails
    };
    return res.status(HttpStatus.OK).json(credDefResponse);
  }

  @Get('/verifiation/cred-defs/:schemaId')
  @ApiOperation({
    summary: 'Get all credential definitions by schema Id',
    description: 'Get all credential definitions by schema Id for verification'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  async getCredentialDefinitionBySchemaId(
    @Param('schemaId', TrimStringParamPipe) schemaId: string,
    @Res() res: Response
  ): Promise<Response> {
    
    const credentialsDefinitions = await this.credentialDefinitionService.getCredentialDefinitionBySchemaId(schemaId);
    const credDefResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.credentialDefinition.success.fetch,
      data: credentialsDefinitions
    };
    return res.status(HttpStatus.OK).json(credDefResponse);
  }

  @Get('/orgs/:orgId/cred-defs')
  @ApiOperation({
    summary: 'Fetch all credential definitions by organization Id',
    description: 'Fetch all credential definitions of provided organization Id with pagination'
  })
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getAllCredDefs(
    @Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }})) orgId: string,
    @Query() getAllCredDefs: GetAllCredDefsDto,
    @User() user: IUserRequestInterface,
    @Res() res: Response
  ): Promise<Response> {
    const credentialsDefinitionDetails = await this.credentialDefinitionService.getAllCredDefs(
      getAllCredDefs,
      user,
      orgId
    );
    const credDefResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.credentialDefinition.success.fetch,
      data: credentialsDefinitionDetails
    };
    return res.status(HttpStatus.OK).json(credDefResponse);
  }

  @Get('/orgs/:orgId/bulk/cred-defs')
  @ApiOperation({
    summary: 'Fetch all credential definitions for bulk opeartion',
    description: 'Retrieve all credential definitions for bulk operation'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getAllCredDefAndSchemaForBulkOperation(
    @Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }})) orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    const credentialsDefinitionDetails = await this.credentialDefinitionService.getAllCredDefAndSchemaForBulkOperation(orgId);
    const credDefResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.credentialDefinition.success.fetch,
      data: credentialsDefinitionDetails
    };
    return res.status(HttpStatus.CREATED).json(credDefResponse);
  }

  @Post('/orgs/:orgId/cred-defs')
  @ApiOperation({
    summary: 'Sends a credential definition to ledger',
    description: 'Sends a credential definition to ledger'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async createCredentialDefinition(
    @User() user: IUserRequestInterface,
    @Body() credDef: CreateCredentialDefinitionDto,
    @Param('orgId', new ParseUUIDPipe({exceptionFactory: (): Error => { throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId); }})) orgId: string,
    @Res() res: Response
  ): Promise<Response> {

    credDef.orgId = orgId;
    const credentialsDefinitionDetails = await this.credentialDefinitionService.createCredentialDefinition(credDef, user);
    const credDefResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.credentialDefinition.success.create,
      data: credentialsDefinitionDetails
    };
    return res.status(HttpStatus.CREATED).json(credDefResponse);
  }

}