import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Res,
  UseFilters,
  UseGuards
} from '@nestjs/common';
import type { user as PrismaUser } from '@prisma/client';
import { ApiResponseDto } from '../../dtos/apiResponse.dto';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { IResponse } from '@credebl/common/interfaces/response.interface';
import { OrgRoles } from 'libs/org-roles/enums';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Roles } from '../../authz/decorators/roles.decorator';
import { UnauthorizedErrorDto } from '../../dtos/unauthorized-error.dto';
import { EcosystemRolesGuard } from '../../authz/guards/ecosystem-roles.guard';
import { User } from '../../authz/decorators/user.decorator';
import { IIntentTemplateList } from '@credebl/common/interfaces/intents-template.interface';
import { CreateIntentDto } from 'apps/ecosystem/dtos/create-intent.dto';
import { UpdateIntentDto } from 'apps/ecosystem/dtos/update-intent.dto';
import { GetAllIntentTemplatesResponseDto } from '../../utilities/dtos/get-all-intent-templates-response.dto';
import { GetAllIntentTemplatesDto } from '../../utilities/dtos/get-all-intent-templates.dto';
import { CreateIntentTemplateDto, UpdateIntentTemplateDto } from '../../utilities/dtos/intent-template.dto';
import { EcosystemFeatureGuard } from '../../authz/guards/ecosystem-feature-guard';
import { PaginationDto } from '@credebl/common/dtos/pagination.dto';
import { TrimStringParamPipe } from '@credebl/common/cast.helper';
import { EcosystemService } from '../ecosystem.service';
import { ForbiddenErrorDto } from '../../dtos/forbidden-error.dto';

@UseFilters(CustomExceptionFilter)
@Controller('intent')
@ApiTags('intent')
@UseGuards(EcosystemFeatureGuard)
@ApiUnauthorizedResponse({
  description: 'Unauthorized',
  type: UnauthorizedErrorDto
})
@ApiForbiddenResponse({
  description: 'Forbidden',
  type: ForbiddenErrorDto
})
export class IntentController {
  constructor(private readonly ecosystemService: EcosystemService) {}

  /**
   * Create Intent
   * @param createIntentDto
   * @returns Created intent
   */
  @Post('/ecosystem/:ecosystemId')
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create Intent',
    description: 'Creates a new intent within the specified ecosystem.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Intent created successfully',
    type: ApiResponseDto
  })
  async createIntent(
    @Body() createIntentDto: CreateIntentDto,
    @Param(
      'ecosystemId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfEcosystemId);
        }
      })
    )
    ecosystemId: string,
    @User() user: PrismaUser,
    @Res() res: Response
  ): Promise<Response> {
    createIntentDto.ecosystemId = ecosystemId;
    createIntentDto.userId = user?.id;

    const intent = await this.ecosystemService.createIntent(createIntentDto);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.ecosystem.success.intentCreated,
      data: intent
    };

    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Get('/ecosystem/:ecosystemId')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get intents by ecosystem',
    description: 'Retrieves all intents associated with a specific ecosystem.'
  })
  @ApiQuery({
    name: 'intentId',
    required: false,
    type: String
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Intents fetched successfully',
    type: ApiResponseDto
  })
  async getIntents(
    @Res() res: Response,
    @Param(
      'ecosystemId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfEcosystemId);
        }
      })
    )
    ecosystemId: string,
    @Query() pageDto: PaginationDto,
    @Query(
      'intentId',
      new ParseUUIDPipe({
        optional: true,
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfIntentId);
        }
      })
    )
    intentId?: string
  ): Promise<Response> {
    const intents = await this.ecosystemService.getIntents(ecosystemId, pageDto, intentId?.trim());

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetchIntents,
      data: intents
    });
  }

  /**
   * Update intent
   * @param id Intent ID
   * @param updateIntentDto
   * @returns Updated intent
   */
  @Put('/ecosystem/:ecosystemId/:intentId')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Update Intent',
    description: 'Updates an existing intent within the specified ecosystem.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Intent updated successfully',
    type: ApiResponseDto
  })
  async updateIntent(
    @Param(
      'ecosystemId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfEcosystemId);
        }
      })
    )
    ecosystemId: string,
    @Param(
      'intentId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfIntentId);
        }
      })
    )
    intentId: string,
    @Body() updateIntentDto: UpdateIntentDto,
    @User() user: PrismaUser,
    @Res() res: Response
  ): Promise<Response> {
    updateIntentDto.userId = user?.id;
    updateIntentDto.intentId = intentId;
    updateIntentDto.ecosystemId = ecosystemId;

    const intent = await this.ecosystemService.updateIntent(updateIntentDto);

    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.intentUpdated,
      data: intent
    };

    return res.status(HttpStatus.OK).json(finalResponse);
  }
  /**
   * Delete intent
   * @param id Intent ID
   * @returns Deleted intent
   */
  @Delete('/ecosystem/:ecosystemId/:intentId')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Delete Intent',
    description: 'Deletes an intent from the specified ecosystem.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Intent deleted successfully',
    type: ApiResponseDto
  })
  async deleteIntent(
    @Param(
      'ecosystemId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfEcosystemId);
        }
      })
    )
    ecosystemId: string,
    @Param(
      'intentId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidFormatOfIntentId);
        }
      })
    )
    intentId: string,

    @User() user: PrismaUser,
    @Res() res: Response
  ): Promise<Response> {
    const intent = await this.ecosystemService.deleteIntent(ecosystemId, intentId, user.id);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.deleteIntent,
      data: intent
    });
  }

  // verification template details by org Id
  /**
   * Get template details by org ID
   */
  @Get('/org/:orgId/verification-templates')
  @Roles(OrgRoles.ECOSYSTEM_LEAD, OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get template details by orgId',
    description: 'Retrieve verification template details by orgId'
  })
  @ApiParam({
    name: 'orgId',
    required: true,
    description: 'Organization ID'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Template details fetched successfully'
  })
  async getTemplateByIntentId(
    @Param(
      'orgId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.ecosystem.error.invalidOrgId);
        }
      })
    )
    orgId: string,
    @Res() res: Response,
    @Query() pageDto: PaginationDto
  ): Promise<Response> {
    const templates = await this.ecosystemService.getVerificationTemplates(orgId, pageDto);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      message: ResponseMessages.ecosystem.success.fetchVerificationTemplates,
      data: templates
    });
  }

  // Intent Template CRUD operations
  /**
   * Create a new intent template mapping
   * @param createIntentTemplateDto The intent template mapping details
   * @param res The response object
   * @returns The created intent template mapping
   */
  @Post('/template')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({ summary: 'Create intent template', description: 'Creates a new intent template mapping.' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Intent template created successfully',
    type: ApiResponseDto
  })
  async createIntentTemplate(
    @Body() createIntentTemplateDto: CreateIntentTemplateDto,
    @User() user: PrismaUser,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.ecosystemService.createIntentTemplate(createIntentTemplateDto, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: 'Intent template created successfully',
      data: intentTemplate
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Get all intent templates
   * @param res The response object
   * @returns List of all intent templates
   */
  @Get('/templates')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get All Intent Templates',
    description: 'Retrieves a list of all available intent templates.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Intent templates retrieved successfully',
    type: GetAllIntentTemplatesResponseDto
  })
  async getAllIntentTemplates(
    @Query() intentTemplateSearchCriteria: GetAllIntentTemplatesDto,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplates: IIntentTemplateList =
      await this.ecosystemService.getAllIntentTemplatesByQuery(intentTemplateSearchCriteria);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent templates retrieved successfully',
      data: intentTemplates
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get intent template by intent name and verifier organization ID
   * @param body The intent name and verifier organization ID
   * @param res The response object
   * @returns The intent template details (org-specific if exists, otherwise global)
   */
  @Get('/:intentName/org/:orgId/templates')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get Intent Template by Intent and Organization',
    description:
      'Retrieves the template mapped to a specific intent and organization. Returns organization-specific template if available, otherwise default template.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template retrieved successfully', type: ApiResponseDto })
  async getIntentTemplateByIntentAndOrg(
    @Param('intentName') intentName: string,
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
    const intentTemplate = await this.ecosystemService.getIntentTemplateByIntentAndOrg(intentName, orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: intentTemplate ? 'Intent template retrieved successfully' : 'No intent template found',
      data: intentTemplate
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get intent templates by intent ID
   * @param intentId The intent ID
   * @param res The response object
   * @returns List of intent templates for the intent
   */
  @Get('/:intentId/templates')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get templates by intent',
    description: 'Retrieves all templates associated with a specific intent.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent templates retrieved successfully', type: ApiResponseDto })
  async getIntentTemplatesByIntentId(
    @Param(
      'intentId',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid intent ID format');
        }
      })
    )
    intentId: string,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplates = await this.ecosystemService.getIntentTemplatesByIntentId(intentId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent templates retrieved successfully',
      data: intentTemplates
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get intent templates by organization ID
   * @param orgId The organization ID
   * @param res The response object
   * @returns List of intent templates for the organization
   */
  @Get('/org/:orgId/templates/')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD, OrgRoles.OWNER)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get templates by organization',
    description: 'Retrieves all templates associated with a specific organization.'
  })
  @ApiParam({
    name: 'orgId',
    required: true,
    description: 'Organization ID'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent templates retrieved successfully', type: ApiResponseDto })
  async getIntentTemplatesByOrgId(
    @Param(
      'orgId',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException('Invalid orgId format');
        }
      })
    )
    orgId: string,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplates = await this.ecosystemService.getIntentTemplatesByOrgId(orgId);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent templates retrieved successfully',
      data: intentTemplates
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Get intent template by ID
   * @param id The intent template ID
   * @param res The response object
   * @returns The intent template details
   */
  @Get('/template/:id')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({
    summary: 'Get template by ID',
    description: 'Retrieves details of a specific intent template using its unique identifier.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template retrieved successfully', type: ApiResponseDto })
  async getIntentTemplateById(
    @Param(
      'id',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.oid4vpIntentToTemplate.error.invalidId);
        }
      })
    )
    id: string,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.ecosystemService.getIntentTemplateById(id);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent template retrieved successfully',
      data: intentTemplate
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Update intent template
   * @param id The intent template ID
   * @param updateIntentTemplateDto The updated intent template details
   * @param res The response object
   * @returns The updated intent template
   */
  @Put('/template/:id')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({ summary: 'Update Intent Template', description: 'Updates an existing intent template mapping.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template updated successfully', type: ApiResponseDto })
  async updateIntentTemplate(
    @Param(
      'id',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.oid4vpIntentToTemplate.error.invalidId);
        }
      })
    )
    id: string,
    @Body() updateIntentTemplateDto: UpdateIntentTemplateDto,
    @User() user: PrismaUser,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.ecosystemService.updateIntentTemplate(id, updateIntentTemplateDto, user);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent template updated successfully',
      data: intentTemplate
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * Delete intent template
   * @param id The intent template ID
   * @param res The response object
   * @returns The deleted intent template
   */
  @Delete('/template/:id')
  @ApiBearerAuth()
  @Roles(OrgRoles.ECOSYSTEM_LEAD)
  @UseGuards(AuthGuard('jwt'), EcosystemRolesGuard)
  @ApiOperation({ summary: 'Delete Intent Template', description: 'Deletes an existing intent template mapping.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template deleted successfully', type: ApiResponseDto })
  async deleteIntentTemplate(
    @Param(
      'id',
      TrimStringParamPipe,
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.oid4vpIntentToTemplate.error.invalidId);
        }
      })
    )
    id: string,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.ecosystemService.deleteIntentTemplate(id);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent template deleted successfully',
      data: intentTemplate
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
