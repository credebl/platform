/* eslint-disable default-param-last */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable camelcase */
import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpStatus,
  Res,
  Get,
  Param,
  UseFilters,
  BadRequestException,
  ParseUUIDPipe,
  Delete,
  Patch,
  Query,
  Put,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiExcludeEndpoint
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { Response } from 'express';
import IResponseType, { IResponse } from '@credebl/common/interfaces/response.interface';
import { User } from '../authz/decorators/user.decorator';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { user } from '@prisma/client';
import { IssuerCreationDto, IssuerUpdationDto } from './dtos/oid4vc-issuer.dto';
import { CreateCredentialTemplateDto, UpdateCredentialTemplateDto } from './dtos/oid4vc-issuer-template.dto';
import { OidcIssueCredentialDto } from './dtos/oid4vc-credential-wh.dto';
import { Oid4vcIssuanceService } from './oid4vc-issuance.service';
import {
  CreateCredentialOfferD2ADto,
  CreateOidcCredentialOfferDto,
  GetAllCredentialOfferDto,
  UpdateCredentialRequestDto
} from './dtos/issuer-sessions.dto';

@Controller()
@UseFilters(CustomExceptionFilter)
@ApiTags('OID4VC')
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
export class Oid4vcIssuanceController {
  private readonly logger = new Logger('Oid4vcIssuanceController');
  constructor(private readonly oid4vcIssuanceService: Oid4vcIssuanceService) {}
  /**
   * Create issuer against a org(tenant)
   * @param orgId The ID of the organization
   * @param user The user making the request
   * @param res The response object
   * @returns The status of the deletion operation
   */

  @Post('/orgs/:orgId/oid4vc/issuers')
  @ApiOperation({
    summary: 'Create OID4VC issuer',
    description: 'Creates a new OID4VC issuer for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Issuer created successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcIssuerCreate(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @User() user: user,
    @Body() issueCredentialDto: IssuerCreationDto,
    @Res() res: Response
  ): Promise<Response> {
    const createIssuer = await this.oid4vcIssuanceService.oidcIssuerCreate(issueCredentialDto, orgId, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oidcIssuer.success.issuerConfig,
      data: createIssuer
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/orgs/:orgId/oid4vc/issuers/:issuerId')
  @ApiOperation({
    summary: 'Update OID4VC issuer',
    description: 'Updates an existing OID4VC issuer for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Issuer updated successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcIssuerUpdate(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @User() user: user,
    @Param('issuerId')
    issuerId: string,
    @Body() issueCredentialDto: IssuerUpdationDto,
    @Res() res: Response
  ): Promise<Response> {
    issueCredentialDto.issuerId = issuerId;
    const createIssuer = await this.oid4vcIssuanceService.oidcIssuerUpdate(issueCredentialDto, orgId, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oidcIssuer.success.issuerConfigUpdate,
      data: createIssuer
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vc/issuers/:id')
  @ApiOperation({ summary: 'Get OID4VC issuer', description: 'Retrieves an OID4VC issuer by id.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Issuer fetched successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcGetIssuerById(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param('id')
    id: string,
    @Res() res: Response
  ): Promise<Response> {
    const oidcIssuer = await this.oid4vcIssuanceService.oidcGetIssuerById(id, orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuer.success.fetch,
      data: oidcIssuer
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vc/issuers')
  @ApiOperation({
    summary: 'Get OID4VC issuers',
    description: 'Retrieves all OID4VC issuers for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Issuers fetched successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async oidcGetIssuers(
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
    const oidcIssuer = await this.oid4vcIssuanceService.oidcGetIssuers(orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuer.success.fetch,
      data: oidcIssuer
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/orgs/:orgId/oid4vc/issuers/:id')
  @ApiOperation({
    summary: 'Delete OID4VC issuer',
    description: 'Deletes an OID4VC issuer for the specified organization.'
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async deleteOidcIssuer(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    id: string,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    await this.oid4vcIssuanceService.oidcDeleteIssuer(user, orgId, id);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuer.success.delete
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('/orgs/:orgId/oid4vc/:issuerId/template')
  @ApiOperation({
    summary: 'Create credential template',
    description: 'Creates a new credential template for the specified issuer.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Template created successfully.' })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async createTemplate(
    @Param('orgId')
    orgId: string,
    @Param('issuerId')
    issuerId: string,
    @User() user: user,
    @Body() CredentialTemplate: CreateCredentialTemplateDto,
    @Res() res: Response
  ): Promise<Response> {
    CredentialTemplate.issuerId = issuerId;
    const template = await this.oid4vcIssuanceService.createTemplate(CredentialTemplate, user, orgId, issuerId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oidcTemplate.success.create,
      data: template
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vc/:issuerId/template')
  @ApiOperation({
    summary: 'List credential templates',
    description: 'Lists all credential templates for the specified issuer.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of templates.' })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async listTemplates(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param(
      'issuerId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.oidcTemplate.error.invalidId);
        }
      })
    )
    issuerId: string,
    @Res() res: Response
  ): Promise<Response> {
    const templates = await this.oid4vcIssuanceService.findAllTemplate(orgId, issuerId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcTemplate.success.fetch,
      data: templates
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vc/:issuerId/template/:templateId')
  @ApiOperation({ summary: 'Get credential template by ID', description: 'Retrieves a credential template by its ID.' })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getTemplateById(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param('templateId')
    templateId: string,
    @Res() res: Response
  ): Promise<Response> {
    const template = await this.oid4vcIssuanceService.findByIdTemplate(orgId, templateId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcTemplate.success.getById,
      data: template
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Patch('/orgs/:orgId/oid4vc/:issuerId/template/:templateId')
  @ApiOperation({
    summary: 'Update credential template',
    description: 'Updates a credential template for the specified issuer.'
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async updateTemplate(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param(
      'issuerId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    issuerId: string,
    @Param(
      'templateId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    templateId: string,
    @User() user: user,
    @Body() dto: UpdateCredentialTemplateDto,
    @Res() res: Response
  ): Promise<Response> {
    const updated = await this.oid4vcIssuanceService.updateTemplate(user, orgId, templateId, dto, issuerId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcTemplate.success.update,
      data: updated
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/orgs/:orgId/oid4vc/:issuerId/template/:templateId')
  @ApiOperation({
    summary: 'Delete credential template',
    description: 'Deletes a credential template for the specified issuer.'
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async deleteTemplate(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param(
      'issuerId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    issuerId: string,
    @Param(
      'templateId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    templateId: string,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    await this.oid4vcIssuanceService.deleteTemplate(user, orgId, templateId, issuerId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcTemplate.success.delete
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('/orgs/:orgId/oid4vc/:issuerId/create-offer')
  @ApiOperation({
    summary: 'Create OID4VC Credential Offer',
    description: 'Creates a new OID4VC credential-offer for a given issuer.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Credential offer created successfully.' })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async createOidcCredentialOffer(
    @Param('orgId')
    orgId: string,
    @Param('issuerId')
    issuerId: string,
    @User() user: user,
    @Body() oidcCredentialPayload: CreateOidcCredentialOfferDto,
    @Res() res: Response
  ): Promise<Response> {
    oidcCredentialPayload.issuerId = issuerId;
    const template = await this.oid4vcIssuanceService.createOidcCredentialOffer(
      oidcCredentialPayload,
      user,
      orgId,
      issuerId
    );
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oidcIssuerSession.success.create,
      data: template
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Put('/orgs/:orgId/oid4vc/:issuerId/:credentialId/update-offer')
  @ApiOperation({
    summary: 'Update OID4VC Credential Offer',
    description: 'Updates an existing OIDC4VCI credential-offer.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Credential offer updated successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async updateCredentialOffers(
    @Body() oidcUpdateCredentialPayload: UpdateCredentialRequestDto,
    @Param('orgId') orgId: string,
    @Param('issuerId') issuerId: string,
    @Param('credentialId') credentialId: string,
    @Res() res: Response
  ): Promise<Response> {
    oidcUpdateCredentialPayload.issuerId = issuerId;
    oidcUpdateCredentialPayload.credentialOfferId = credentialId;
    const updateCredentialOffer = await this.oid4vcIssuanceService.updateOidcCredentialOffer(
      oidcUpdateCredentialPayload,
      orgId,
      issuerId
    );

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuerSession.success.update,
      data: updateCredentialOffer
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vc/credential-offer/:id')
  @ApiOperation({
    summary: 'Get OID4VC credential offer',
    description: 'Retrieves an OID4VC credential offer by its ID.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Credential offer fetched successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getCredentialOfferDetailsById(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Param('id')
    id: string,
    @Res() res: Response
  ): Promise<Response> {
    const oidcIssuer = await this.oid4vcIssuanceService.getCredentialOfferDetailsById(id, orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuerSession.success.getById,
      data: oidcIssuer
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vc/credential-offer')
  @ApiOperation({
    summary: 'Get all OID4VC credential offers',
    description: 'Retrieves all OID4VC credential offers for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All credential offers fetched successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getAllCredentialOffers(
    @Query() getAllCredentialOffer: GetAllCredentialOfferDto,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    const connectionDetails = await this.oid4vcIssuanceService.getAllCredentialOffers(orgId, getAllCredentialOffer);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuerSession.success.getAll,
      data: connectionDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/orgs/:orgId/oid4vc/:credentialId/delete-offer')
  @ApiOperation({
    summary: 'Delete OID4VC credential offer',
    description: 'Deletes an OID4VC credential offer for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Credential offer deleted successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async deleteCredentialOffers(
    @Param('orgId') orgId: string,
    @Param('credentialId') credentialId: string,
    @Res() res: Response
  ): Promise<Response> {
    const deletedofferDetails = await this.oid4vcIssuanceService.deleteCredentialOffers(orgId, credentialId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.NO_CONTENT,
      message: ResponseMessages.oidcIssuerSession.success.delete,
      data: deletedofferDetails
    };
    return res.status(HttpStatus.NO_CONTENT).json(finalResponse);
  }

  @Post('/orgs/:orgId/oid4vc/create-offer/agent')
  @ApiOperation({
    summary: 'Create OID4VC Credential Offer direct to agent',
    description: 'Creates a new OIDC4VCI credential-offer for a given issuer.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Credential offer created successfully.' })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async createOidcCredentialOfferD2A(
    @Param('orgId')
    orgId: string,
    @Body() oidcCredentialD2APayload: CreateCredentialOfferD2ADto,
    @Res() res: Response
  ): Promise<Response> {
    const credentialOffer = await this.oid4vcIssuanceService.createOidcCredentialOfferD2A(
      oidcCredentialD2APayload,
      orgId
    );
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oidcIssuerSession.success.create,
      data: credentialOffer
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Catch issue credential webhook responses
   * @param oidcIssueCredentialDto The details of the oid4vc issued credential
   * @param id The ID of the organization
   * @param res The response object
   * @returns The details of the oid4vc issued credential
   */
  @Post('wh/:id/openid4vc-issuance')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Catch OID4VC credential states',
    description: 'Handles webhook responses for OID4VC credential issuance.'
  })
  async getIssueCredentialWebhook(
    @Body() oidcIssueCredentialDto: OidcIssueCredentialDto,
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<Response> {
    if (id && 'default' === oidcIssueCredentialDto.contextCorrelationId) {
      oidcIssueCredentialDto.orgId = id;
    }

    const getCredentialDetails = await this.oid4vcIssuanceService.oidcIssueCredentialWebhook(
      oidcIssueCredentialDto,
      id
    );

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.create,
      data: getCredentialDetails
    };

    const webhookUrl = await this.oid4vcIssuanceService
      ._getWebhookUrl(oidcIssueCredentialDto.contextCorrelationId, id)
      .catch((error) => {
        this.logger.debug(`error in getting webhook url ::: ${JSON.stringify(error)}`);
      });
    if (webhookUrl) {
      this.logger.log(`Posting response to the webhook url`);
      const plainIssuanceDto = JSON.parse(JSON.stringify(oidcIssueCredentialDto));

      await this.oid4vcIssuanceService._postWebhookResponse(webhookUrl, { data: plainIssuanceDto }).catch((error) => {
        this.logger.debug(`error in posting webhook  response to webhook url ::: ${JSON.stringify(error)}`);
      });
    }

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
}
