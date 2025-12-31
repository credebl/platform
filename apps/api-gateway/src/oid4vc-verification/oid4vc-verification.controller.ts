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
  Param,
  UseFilters,
  BadRequestException,
  ParseUUIDPipe,
  Get,
  Query,
  Put,
  Delete,
  Logger
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
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
import { Oid4vcVerificationService } from './oid4vc-verification.service';
import { CreateVerifierDto, UpdateVerifierDto } from './dtos/oid4vc-verifier.dto';
import { PresentationRequestDto, VerificationPresentationQueryDto } from './dtos/oid4vc-verifier-presentation.dto';
import { Oid4vpPresentationWhDto } from '../oid4vc-issuance/dtos/oid4vp-presentation-wh.dto';
import { CreateVerificationTemplateDto, UpdateVerificationTemplateDto } from './dtos/verification-template.dto';
import { CreateIntentBasedVerificationDto } from './dtos/create-intent-based-verification.dto';

@Controller()
@UseFilters(CustomExceptionFilter)
@ApiTags('OID4VP')
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
export class Oid4vcVerificationController {
  private readonly logger = new Logger('Oid4vcVerificationController');

  constructor(private readonly oid4vcVerificationService: Oid4vcVerificationService) {}
  /**
   * Create issuer against a org(tenant)
   * @param orgId The ID of the organization
   * @param user The user making the request
   * @param res The response object
   * @returns The status of the deletion operation
   */

  @Post('/orgs/:orgId/oid4vp/verifier')
  @ApiOperation({
    summary: 'Create OID4VP verifier',
    description: 'Creates a new OID4VP verifier for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Verifier created successfully.', type: ApiResponseDto })
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
    @Body() createVerifier: CreateVerifierDto,
    @Res() res: Response
  ): Promise<Response> {
    this.logger.debug(`[oidcIssuerCreate] Called with orgId=${orgId}, user=${user.id}`);

    const createVerifierRes = await this.oid4vcVerificationService.oid4vpCreateVerifier(createVerifier, orgId, user);

    this.logger.debug(`[oidcIssuerCreate] Verifier created: ${createVerifierRes.id}`);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oid4vp.success.create,
      data: createVerifierRes
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Create issuer against a org(tenant)
   * @param orgId The ID of the organization
   * @param verifierId The ID of the Verifier
   * @param user The user making the request
   * @param res The response object
   * @returns The status of the verifier update operation
   */
  @Put('/orgs/:orgId/oid4vp/verifier/:verifierId')
  @ApiOperation({
    summary: 'Update OID4VP verifier',
    description: 'Updates OID4VP verifier for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verifier updated successfully.', type: ApiResponseDto })
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
    @Param('verifierId')
    verifierId: string,
    @User() user: user,
    @Body() updateVerifier: UpdateVerifierDto,
    @Res() res: Response
  ): Promise<Response> {
    this.logger.debug(`[oidcIssuerUpdate] Called with orgId=${orgId}, verifierId=${verifierId}, user=${user.id}`);
    const updateVerifierRes = await this.oid4vcVerificationService.oid4vpUpdateVerifier(
      updateVerifier,
      orgId,
      verifierId,
      user
    );

    this.logger.debug(`[oidcIssuerUpdate] Verifier updated: ${updateVerifierRes.id}`);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oid4vp.success.update,
      data: updateVerifierRes
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vp/verifier')
  @ApiOperation({
    summary: 'Get OID4VP verifier details',
    description: 'Retrieves details of a specific OID4VP verifier by its ID for the specified organization.'
  })
  @ApiQuery({
    name: 'verifierId',
    required: false,
    type: String,
    description: 'UUID of the verifier (optional)'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verifier details retrieved successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getVerifierDetails(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Res() res: Response,
    @Query(
      'verifierId',
      new ParseUUIDPipe({
        version: '4',
        optional: true,
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid verifier ID');
        }
      })
    )
    verifierId?: string
  ): Promise<Response> {
    this.logger.debug(`[getVerifierDetails] Called with orgId=${orgId}, verifierId=${verifierId}`);

    const verifierDetails = await this.oid4vcVerificationService.oid4vpGetVerifier(orgId, verifierId);

    this.logger.debug(`[getVerifierDetails] Result fetched successfully`);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oid4vp.success.fetch,
      data: verifierDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/orgs/:orgId/oid4vp/verifier')
  @ApiOperation({
    summary: 'Delete OID4VP verifier details',
    description: 'Delete a specific OID4VP verifier by its ID for the specified organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Verifier deleted successfully.', type: ApiResponseDto })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async deleteVerifierDetails(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Res() res: Response,
    @Query(
      'verifierId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid verifier ID');
        }
      })
    )
    verifierId: string
  ): Promise<Response> {
    this.logger.debug(`[deleteVerifierDetails] Called with orgId=${orgId}, verifierId=${verifierId}`);

    const verifierDetails = await this.oid4vcVerificationService.oid4vpDeleteVerifier(orgId, verifierId);

    this.logger.debug(`[deleteVerifierDetails] Deleted verifier: ${verifierId}`);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.oid4vp.success.delete,
      data: verifierDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Post('/orgs/:orgId/oid4vp/presentation')
  @ApiOperation({
    summary: 'Create verification presentation',
    description: 'Creates a new OID4VP verification presentation for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Verification presentation created successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async createVerificationPresentation(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Query(
      'verifierId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid verifier ID');
        }
      })
    )
    verifierId: string,
    @User() user: user,
    @Body() createPresentationDto: PresentationRequestDto,
    @Res() res: Response
  ): Promise<Response> {
    this.logger.debug(
      `[createVerificationPresentation] Called with orgId=${orgId}, verifierId=${verifierId}, user=${user.id}`
    );

    const presentation = await this.oid4vcVerificationService.oid4vpCreateVerificationSession(
      createPresentationDto,
      orgId,
      user,
      verifierId
    );

    this.logger.debug(`[createVerificationPresentation] Presentation created successfully`);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oid4vpSession.success.create,
      data: presentation
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/orgs/:orgId/oid4vp/intent-based-verification-presentation')
  @ApiOperation({
    summary: 'Create intent-based verification presentation',
    description: 'Creates a new verification presentation using an intent template for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Verification presentation created successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async createIntentBasedVerificationPresentation(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Query(
      'verifierId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid verifier ID');
        }
      })
    )
    verifierId: string,
    @User() user: user,
    @Body() createIntentDto: CreateIntentBasedVerificationDto,
    @Res() res: Response
  ): Promise<Response> {
    this.logger.debug(
      `[createIntentBasedVerificationPresentation] Called with orgId=${orgId}, verifierId=${verifierId}, intent=${createIntentDto?.intent}, user=${user.id}`
    );

    const presentation = await this.oid4vcVerificationService.createIntentBasedVerificationPresentation(
      orgId,
      verifierId,
      createIntentDto,
      user
    );

    this.logger.debug(`[createIntentBasedVerificationPresentation] Presentation created successfully`);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oid4vpSession.success.create,
      data: presentation
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vp/verifier-presentation')
  @ApiOperation({
    summary: 'Get OID4VP verifier presentation details',
    description:
      'Retrieves details of all OID4VP verifier presentations or a single presentation by its ID for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verifier details retrieved successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getVerificationPresentation(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Query() query: VerificationPresentationQueryDto,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.debug(`getVerificationPresentation() called with orgId: ${orgId}`);
      const result = await this.oid4vcVerificationService.oid4vpGetVerifierSession(orgId, query);

      this.logger.debug(`Verifier session details fetched successfully for orgId: ${orgId}`);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Verifier details retrieved successfully.',
        data: result
      });
    } catch (error) {
      this.logger.debug(
        `Error in getVerificationPresentation(): ${error.message || 'Failed to fetch verifier presentation.'}`
      );
      throw new BadRequestException(error.message || 'Failed to fetch verifier presentation.');
    }
  }

  @Get('/orgs/:orgId/oid4vp/verifier-presentation-response')
  @ApiOperation({
    summary: 'Get OID4VP verifier presentation response details',
    description:
      'Retrieves details of OID4VP verifier presentations response by its verification presentation ID for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verifier presentation response details retrieved successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getVerificationPresentationResponse(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Query(
      'verificationPresentationId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid verificationPresentationId ID');
        }
      })
    )
    verificationPresentationId: string,
    @Res() res: Response
  ): Promise<Response> {
    try {
      this.logger.debug(
        `getVerificationPresentationResponse() called with orgId: ${orgId}, verificationPresentationId: ${verificationPresentationId}`
      );
      const result = await this.oid4vcVerificationService.getVerificationSessionResponse(
        orgId,
        verificationPresentationId
      );

      this.logger.debug(
        `Verifier presentation response details fetched successfully for verificationPresentationId: ${verificationPresentationId}`
      );

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Verifier presentation response details retrieved successfully.',
        data: result
      });
    } catch (error) {
      this.logger.debug(
        `Error in getVerificationPresentationResponse(): ${error.message || 'Failed to fetch verifier presentation response details.'}`
      );
      throw new BadRequestException(error.message || 'Failed to fetch verifier presentation response details.');
    }
  }
  /**
   * Catch issue credential webhook responses
   * @param oid4vpPresentationWhDto The details of the oid4vp presentation webhook
   * @param id The ID of the organization
   * @param res The response object
   * @returns The details of the oid4vp presentation webhook
   */
  @Post('wh/:id/openid4vc-verification')
  @ApiExcludeEndpoint()
  @ApiOperation({
    summary: 'Catch OID4VP presentation states',
    description: 'Handles webhook responses for OID4VP presentation states.'
  })
  async storePresentationWebhook(
    @Body() oid4vpPresentationWhDto: Oid4vpPresentationWhDto,
    @Param('id') id: string,
    @Res() res: Response
  ): Promise<Response> {
    oid4vpPresentationWhDto.type = 'Oid4vpPresentation';
    if (id && 'default' === oid4vpPresentationWhDto.contextCorrelationId) {
      oid4vpPresentationWhDto.orgId = id;
    }

    await this.oid4vcVerificationService.oid4vpPresentationWebhook(oid4vpPresentationWhDto, id);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.oid4vpSession.success.webhookReceived,
      data: []
    };

    const webhookUrl = await this.oid4vcVerificationService
      ._getWebhookUrl(oid4vpPresentationWhDto?.contextCorrelationId, id)
      .catch((error) => {
        this.logger.debug(`error in getting webhook url ::: ${JSON.stringify(error)}`);
      });

    if (webhookUrl) {
      this.logger.log(`posting webhook response to webhook url`);
      await this.oid4vcVerificationService
        ._postWebhookResponse(webhookUrl, { data: oid4vpPresentationWhDto })
        .catch((error) => {
          this.logger.debug(`error in posting webhook response to webhook url ::: ${JSON.stringify(error)}`);
        });
    }

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/orgs/:orgId/oid4vp/verification-template')
  @ApiOperation({
    summary: 'Create verification template',
    description: 'Creates a new verification template for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Verification template created successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async createVerificationTemplate(
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
    @Body() createTemplateDto: CreateVerificationTemplateDto,
    @Res() res: Response
  ): Promise<Response> {
    this.logger.debug(`[createVerificationTemplate] Called with orgId=${orgId}, user=${user.id}`);

    const template = await this.oid4vcVerificationService.createVerificationTemplate(createTemplateDto, orgId, user);

    this.logger.debug(`[createVerificationTemplate] Template created: ${template['id']}`);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: 'Verification template created successfully',
      data: template
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/orgs/:orgId/oid4vp/verification-template')
  @ApiOperation({
    summary: 'Get verification template(s)',
    description: 'Retrieves verification template(s) for the specified organization.'
  })
  @ApiQuery({
    name: 'templateId',
    required: false,
    type: String,
    description: 'UUID of the template (optional)'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification template(s) retrieved successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async getVerificationTemplates(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.organisation.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Res() res: Response,
    @Query(
      'templateId',
      new ParseUUIDPipe({
        version: '4',
        optional: true,
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid template ID');
        }
      })
    )
    templateId?: string
  ): Promise<Response> {
    this.logger.debug(`[getVerificationTemplates] Called with orgId=${orgId}, templateId=${templateId ?? 'all'}`);

    const templates = await this.oid4vcVerificationService.getVerificationTemplates(orgId, templateId);

    this.logger.debug(`[getVerificationTemplates] Templates fetched successfully`);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Verification template(s) retrieved successfully',
      data: templates
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Put('/orgs/:orgId/oid4vp/verification-template/:templateId')
  @ApiOperation({
    summary: 'Update verification template',
    description: 'Updates an existing verification template for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification template updated successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async updateVerificationTemplate(
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
      'templateId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid template ID');
        }
      })
    )
    templateId: string,
    @User() user: user,
    @Body() updateTemplateDto: UpdateVerificationTemplateDto,
    @Res() res: Response
  ): Promise<Response> {
    this.logger.debug(
      `[updateVerificationTemplate] Called with orgId=${orgId}, templateId=${templateId}, user=${user.id}`
    );

    const template = await this.oid4vcVerificationService.updateVerificationTemplate(
      templateId,
      updateTemplateDto,
      orgId,
      user
    );

    this.logger.debug(`[updateVerificationTemplate] Template updated: ${template['id']}`);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Verification template updated successfully',
      data: template
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  @Delete('/orgs/:orgId/oid4vp/verification-template/:templateId')
  @ApiOperation({
    summary: 'Delete verification template',
    description: 'Deletes a verification template for the specified organization.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Verification template deleted successfully.',
    type: ApiResponseDto
  })
  @ApiBearerAuth()
  @Roles(OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), OrgRolesGuard)
  async deleteVerificationTemplate(
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
      'templateId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid template ID');
        }
      })
    )
    templateId: string,
    @Res() res: Response
  ): Promise<Response> {
    this.logger.debug(`[deleteVerificationTemplate] Called with orgId=${orgId}, templateId=${templateId}`);

    const template = await this.oid4vcVerificationService.deleteVerificationTemplate(orgId, templateId);

    this.logger.debug(`[deleteVerificationTemplate] Template deleted: ${templateId}`);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Verification template deleted successfully',
      data: template
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
