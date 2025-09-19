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
  Put
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
import { IssuanceService } from './issuance.service';
import { User } from '../authz/decorators/user.decorator';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Roles } from '../authz/decorators/roles.decorator';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
/* eslint-disable @typescript-eslint/no-unused-vars */
import { user } from '@prisma/client';
import { IssuerCreationDto, IssuerUpdationDto } from './dtos/oidc-issuer.dto';
import { CreateCredentialTemplateDto, UpdateCredentialTemplateDto } from './dtos/oidc-issuer-template.dto';
import {
  CreateOidcCredentialOfferDto,
  GetAllCredentialOfferDto,
  UpdateCredentialRequestDto
} from './dtos/issuer-sessions.dto';
@Controller()
@UseFilters(CustomExceptionFilter)
@ApiTags('OIDC')
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class OidcController {
  constructor(private readonly issueCredentialService: IssuanceService) {}
  /**
   * Create issuer against a org(tenant)
   * @param orgId The ID of the organization
   * @param user The user making the request
   * @param res The response object
   * @returns The status of the deletion operation
   */

  @Post('/orgs/:orgId/oidc/issuers')
  @ApiOperation({ summary: 'Create OIDC issuer', description: 'Create OIDC issuer by orgId' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
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
    const createIssuer = await this.issueCredentialService.oidcIssuerCreate(issueCredentialDto, orgId, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oidcIssuer.success.issuerConfig,
      data: createIssuer
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/orgs/:orgId/oidc/issuers/:issuerId')
  @ApiOperation({ summary: 'Update OIDC issuer', description: 'Update OIDC issuer by orgId' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
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
    const createIssuer = await this.issueCredentialService.oidcIssuerUpdate(issueCredentialDto, orgId, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oidcIssuer.success.issuerConfigUpdate,
      data: createIssuer
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/orgs/:orgId/oidc/issuers/:issuerId')
  @ApiOperation({ summary: 'Get OIDC issuer', description: 'Get OIDC issuer by issuerId' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
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
    @Param('issuerId')
    issuerId: string,
    @Res() res: Response
  ): Promise<Response> {
    const oidcIssuer = await this.issueCredentialService.oidcGetIssuerById(issuerId, orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oidcIssuer.success.fetch,
      data: oidcIssuer
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/orgs/:orgId/oidc/issuers')
  @ApiOperation({ summary: 'Get OIDC issuer', description: 'Get OIDC issuer by orgId' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
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
    const oidcIssuer = await this.issueCredentialService.oidcGetIssuers(orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuer.success.fetch,
      data: oidcIssuer
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/orgs/:orgId/oidc/:issuerId')
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiOperation({ summary: 'Delete oidc issuer' })
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
      'issuerId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    issuerId: string,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    await this.issueCredentialService.oidcDeleteIssuer(user, orgId, issuerId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuer.success.delete
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('/orgs/:orgId/oidc/:issuerId/template')
  @ApiOperation({ summary: 'Create credential template' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Template created successfully' })
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
    console.log('THis is dto', JSON.stringify(CredentialTemplate, null, 2));
    const template = await this.issueCredentialService.createTemplate(CredentialTemplate, user, orgId, issuerId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oidcTemplate.success.create,
      data: template
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/orgs/:orgId/oidc/:issuerId/template')
  @ApiOperation({ summary: 'List credential templates' })
  @ApiResponse({ status: HttpStatus.OK, description: 'List of templates' })
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
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    issuerId: string,
    @User() user: user,
    @Res() res: Response
  ): Promise<Response> {
    const templates = await this.issueCredentialService.findAllTemplate(user, orgId, issuerId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcTemplate.success.fetch,
      data: templates
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/oidc/:issuerId/template/:templateId')
  @ApiOperation({ summary: 'Get credential template by ID' })
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
    const template = await this.issueCredentialService.findByIdTemplate(user, orgId, templateId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcTemplate.success.fetch,
      data: template
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Patch('/orgs/:orgId/oidc/:issuerId/template/:templateId')
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiOperation({ summary: 'Update credential template' })
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
    const updated = await this.issueCredentialService.updateTemplate(user, orgId, templateId, dto, issuerId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcTemplate.success.update,
      data: updated
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/orgs/:orgId/oidc/:issuerId/template/:templateId')
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  @ApiOperation({ summary: 'Delete credential template' })
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
    await this.issueCredentialService.deleteTemplate(user, orgId, templateId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcTemplate.success.delete
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('/orgs/:orgId/oidc/:issuerId/create-offer')
  @ApiOperation({ summary: 'Create OIDC Credential Offer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: `This endpoint creates a new OIDC4VCI credential-offer for a given issuer. It allows clients to request issuance of credentials (e.g., Birth Certificate, Driving License, Student ID) from a registered OIDC issuer using the issuer's ID.`
  })
  // @ApiBearerAuth()
  // @Roles(OrgRoles.OWNER)
  // @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
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
    console.log('This is dto', JSON.stringify(oidcCredentialPayload, null, 2));
    const template = await this.issueCredentialService.createOidcCredentialOffer(
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

  @Put('/orgs/:orgId/oidc/:issuerId/:credentialId/update-offer')
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
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
    const updateCredentialOffer = await this.issueCredentialService.updateOidcCredentialOffer(
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

  @Get('/orgs/:orgId/oidc/credential-offer/:id')
  @ApiOperation({ summary: 'Get OIDC credential offer', description: 'Get OIDC credential offer by id' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
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
    const oidcIssuer = await this.issueCredentialService.getCredentialOfferDetailsById(id, orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuerSession.success.getById,
      data: oidcIssuer
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/oidc/credential-offer')
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getAllCredentialOffers(
    @Query() getAllCredentialOffer: GetAllCredentialOfferDto,
    @Param('orgId') orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    const connectionDetails = await this.issueCredentialService.getAllCredentialOffers(orgId, getAllCredentialOffer);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oidcIssuerSession.success.getAll,
      data: connectionDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/orgs/:orgId/oidc/:credentialId/delete-offer')
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async deleteCredentialOffers(
    @Param('orgId') orgId: string,
    @Param('credentialId') credentialId: string,
    @Res() res: Response
  ): Promise<Response> {
    const deletedofferDetails = await this.issueCredentialService.deleteCredentialOffers(orgId, credentialId);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.NO_CONTENT,
      message: ResponseMessages.oidcIssuerSession.success.delete,
      data: deletedofferDetails
    };
    return res.status(HttpStatus.NO_CONTENT).json(finalResponse);
  }

  /**
   * Catch issue credential webhook responses
   * @param oidcIssueCredentialDto The details of the oidc issued credential
   * @param id The ID of the organization
   * @param res The response object
   * @returns The details of the oidc issued credential
   */
  @Post('wh/:id/credentials')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Catch OIDC credential states',
    description: 'Catch OIDC credential states'
  })
  async getIssueCredentialWebhook(
    @Body() oidcIssueCredentialDto,
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<Response> {
    const getCredentialDetails = await this.issueCredentialService.oidcIssueCredentialWebhook(
      oidcIssueCredentialDto,
      id
    );

    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.issuance.success.create,
      data: getCredentialDetails
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }
}
