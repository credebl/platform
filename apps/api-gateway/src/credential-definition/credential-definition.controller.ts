import {
  Controller,
  Logger,
  Post,
  Body,
  UseGuards,
  Get,
  Query,
  HttpStatus,
  Res,
  Param,
  UseFilters,
  ParseUUIDPipe,
  BadRequestException
} from '@nestjs/common';
import { CredentialDefinitionService } from './credential-definition.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse
} from '@nestjs/swagger';
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
import { EmptyStringParamPipe, TrimStringParamPipe } from '@credebl/common/cast.helper';

@ApiBearerAuth()
@ApiTags('credential-definitions')
@Controller()
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
@UseFilters(CustomExceptionFilter)
export class CredentialDefinitionController {
  constructor(private readonly credentialDefinitionService: CredentialDefinitionService) {}
  private readonly logger = new Logger('CredentialDefinitionController');

  /**
   * Retrieves the details of a specific credential definition.
   *
   * @param orgId The unique identifier of the organization.
   * @param credDefId The unique identifier of the credential definition.
   * @returns The credential definition details.
   */
  @Get('/orgs/:orgId/cred-defs/:credDefId')
  @ApiOperation({
    summary: 'Get credential definition by credential definition Id',
    description:
      'Fetches the details of a specific credential definition using its ID available credential definitions on platform.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getCredentialDefinitionById(
    @Param('orgId') orgId: string,
    @Param('credDefId', TrimStringParamPipe, EmptyStringParamPipe.forParam('credDefId')) credentialDefinitionId: string,
    @Res() res: Response
  ): Promise<Response> {
    const credentialsDefinitionDetails = await this.credentialDefinitionService.getCredentialDefinitionById(
      credentialDefinitionId,
      orgId
    );
    const credDefResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.credentialDefinition.success.fetch,
      data: credentialsDefinitionDetails
    };
    return res.status(HttpStatus.OK).json(credDefResponse);
  }

  /**
   * Retrieves all credential definitions linked to a specific schema.
   *
   * @param schemaId The unique identifier of the schema.
   * @returns A list of credential definitions associated with the schema.
   */
  @Get('/verifiation/cred-defs/:schemaId')
  @ApiOperation({
    summary: 'Get all credential definitions by schema Id',
    description:
      'Fetches all credential definitions associated with a specific schema ID available credential definitions on platform.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @UseGuards(AuthGuard('jwt'))
  async getCredentialDefinitionBySchemaId(
    @Param('schemaId', TrimStringParamPipe) schemaId: string,
    @Res() res: Response
  ): Promise<Response> {
    if (!schemaId) {
      throw new BadRequestException(ResponseMessages.schema.error.invalidSchemaId);
    }

    const credentialsDefinitions = await this.credentialDefinitionService.getCredentialDefinitionBySchemaId(schemaId);
    const credDefResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.credentialDefinition.success.fetch,
      data: credentialsDefinitions
    };
    return res.status(HttpStatus.OK).json(credDefResponse);
  }

  /**
   * Retrieves all credential definitions for a given organization.
   *
   * @param orgId The unique identifier of the organization.
   * @returns A paginated list of credential definitions for the organization.
   */
  @Get('/orgs/:orgId/cred-defs')
  @ApiOperation({
    summary: 'Fetch all credential definitions by organization Id',
    description: 'Fetches all credential definitions belonging to a specific organization created on the platform.'
  })
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN, OrgRoles.ISSUER, OrgRoles.VERIFIER, OrgRoles.MEMBER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getAllCredDefs(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
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

  /**
   * Creates a new credential definition and submits it to the ledger.
   *
   * @param orgId The unique identifier of the organization.
   * @body CreateCredentialDefinitionDto
   * @returns The details of the newly created credential definition.
   */
  @Post('/orgs/:orgId/cred-defs')
  @ApiOperation({
    summary: 'Sends a credential definition to ledger',
    description: 'Creates a new credential definition and submits it to the ledger.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Success', type: ApiResponseDto })
  @Roles(OrgRoles.OWNER, OrgRoles.ADMIN)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async createCredentialDefinition(
    @User() user: IUserRequestInterface,
    @Body() credDef: CreateCredentialDefinitionDto,
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    credDef.orgId = orgId;
    const credentialsDefinitionDetails = await this.credentialDefinitionService.createCredentialDefinition(
      credDef,
      user
    );
    const credDefResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.credentialDefinition.success.create,
      data: credentialsDefinitionDetails
    };
    return res.status(HttpStatus.CREATED).json(credDefResponse);
  }
}
