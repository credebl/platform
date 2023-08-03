import { Controller, Logger, Post, Body, UseGuards, Get, Query, HttpStatus, Res } from '@nestjs/common';
import { CredentialDefinitionService } from './credential-definition.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiQuery } from '@nestjs/swagger';
import { ApiResponseDto } from 'apps/api-gateway/src/dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from 'apps/api-gateway/src/dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from 'apps/api-gateway/src/dtos/forbidden-error.dto';
import { User } from '../authz/decorators/user.decorator';
import { AuthGuard } from '@nestjs/passport';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Response } from 'express';
import { GetAllCredDefsDto } from './dto/get-all-cred-defs.dto';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { IUserRequestInterface } from './interfaces';
import { CreateCredentialDefinitionDto } from './dto/create-cred-defs.dto';
import { OrgRoles } from 'libs/org-roles/enums';
import { Roles } from '../authz/decorators/roles.decorator';


@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), OrgRolesGuard)
@Roles(OrgRoles.OWNER, OrgRoles.SUPER_ADMIN, OrgRoles.ADMIN, OrgRoles.ISSUER)
@ApiTags('credential-definitions')

@ApiUnauthorizedResponse({ status: 401, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: 403, description: 'Forbidden', type: ForbiddenErrorDto })
@Controller('credential-definitions')
export class CredentialDefinitionController {

  constructor(private readonly credentialDefinitionService: CredentialDefinitionService) { }
  private readonly logger = new Logger('CredentialDefinitionController');

  @Post('/')
  @ApiOperation({
    summary: 'Sends a credential definition to the ledger',
    description: 'Create and sends a credential definition to the ledger.'
  })
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async createCredentialDefinition(
    @User() user: IUserRequestInterface,
    @Body() credDef: CreateCredentialDefinitionDto,
    @Res() res: Response
  ): Promise<object> {
    const credentialsDefinitionDetails = await this.credentialDefinitionService.createCredentialDefinition(credDef, user);
    const credDefResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.credentialDefinition.success.create,
      data: credentialsDefinitionDetails.response
    };
    return res.status(HttpStatus.OK).json(credDefResponse);
  }
  @Get('/id')
  @ApiOperation({
    summary: 'Get an existing credential definition by Id',
    description: 'Get an existing credential definition by Id'
  })
  @ApiQuery(
    { name: 'credentialDefinitionId', required: true }
  )
  @ApiQuery(
    { name: 'orgId', required: true }
  )
  @ApiResponse({ status: 201, description: 'Success', type: ApiResponseDto })
  async getCredentialDefinitionById(
    @Query('credentialDefinitionId') credentialDefinitionId: string,
    @Query('orgId') orgId: number,
    @Res() res: Response
  ): Promise<object> {
    const credentialsDefinitionDetails = await this.credentialDefinitionService.getCredentialDefinitionById(credentialDefinitionId, orgId);
    const credDefResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.credentialDefinition.success.fetch,
      data: credentialsDefinitionDetails.response
    };
    return res.status(HttpStatus.OK).json(credDefResponse);
  }

  @Get('/')
  @ApiOperation({
    summary: 'Fetch all credential definitions of provided organization id with pagination',
    description: 'Fetch all credential definitions from metadata saved in database of provided organization id.'
  })
  async getAllCredDefs(
    @Query() getAllCredDefs: GetAllCredDefsDto,
    @User() user: IUserRequestInterface,
    @Res() res: Response
  ): Promise<object> {
    const { pageSize, pageNumber, sortByValue, sorting, orgId, searchByText, revocable } = getAllCredDefs;
    const credDefSearchCriteria = { pageSize, pageNumber, searchByText, sorting, sortByValue, revocable };
    const credentialsDefinitionDetails = await this.credentialDefinitionService.getAllCredDefs(
      credDefSearchCriteria,
      user,
      orgId
    );
    const credDefResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.credentialDefinition.success.fetch,
      data: credentialsDefinitionDetails.response
    };
    return res.status(HttpStatus.OK).json(credDefResponse);
  }
}