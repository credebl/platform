import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import {
  Controller,
  UseFilters,
  Post,
  Body,
  Res,
  HttpStatus,
  Param,
  UseGuards,
  ParseBoolPipe,
  Get,
  Query,
  Put,
  Delete,
  ParseUUIDPipe,
  BadRequestException
} from '@nestjs/common';
import IResponse from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { StoreObjectDto, UtilitiesDto } from './dtos/shortening-url.dto';
import { CreateIntentTemplateDto, UpdateIntentTemplateDto } from './dtos/intent-template.dto';
import { GetAllIntentTemplatesDto } from './dtos/get-all-intent-templates.dto';
import { GetIntentTemplateByIntentAndOrgDto } from './dtos/get-intent-template-by-intent-and-org.dto';
import { GetAllIntentTemplatesResponseDto } from './dtos/get-all-intent-templates-response.dto';
import { UtilitiesService } from './utilities.service';
import { IIntentTemplateList } from '@credebl/common/interfaces/intents-template.interface';
import { AuthGuard } from '@nestjs/passport';
import { User } from '../authz/decorators/user.decorator';
import { IUserRequest } from '@credebl/user-request/user-request.interface';

@UseFilters(CustomExceptionFilter)
@Controller('utilities')
@ApiTags('utilities')
@ApiUnauthorizedResponse({ description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ description: 'Forbidden', type: ForbiddenErrorDto })
export class UtilitiesController {
  constructor(private readonly utilitiesService: UtilitiesService) {}

  /**
   * Create a shortening URL
   * @param shorteningUrlDto The details for the URL to be shortened
   * @param res The response object
   * @returns The created shortening URL details
   */
  @Post('/')
  @ApiOperation({ summary: 'Create Shortening URL', description: 'Create a shortening URL for the provided details.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Shortening URL created successfully', type: ApiResponseDto })
  async createShorteningUrl(@Body() shorteningUrlDto: UtilitiesDto, @Res() res: Response): Promise<Response> {
    const shorteningUrl = await this.utilitiesService.createShorteningUrl(shorteningUrlDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.shorteningUrl.success.createShorteningUrl,
      data: shorteningUrl
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  /**
   * Store an object and return a short URL to it
   * @param storeObjectDto The object details to be stored
   * @param persist Whether the object should be persisted
   * @param res The response object
   * @returns The created short URL representing the object
   */
  @Post('/store-object/:persist')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Store Object and Create Short URL',
    description: 'Store an object and create a short URL representing the object.'
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Object stored and short URL created successfully',
    type: ApiResponseDto
  })
  async storeObject(
    @Body() storeObjectDto: StoreObjectDto,
    // Since Params are always strings, we need to parse the value.
    // This prevent for example 'false' being considered as a truthy value
    @Param('persist', ParseBoolPipe) persist: boolean,
    @Res() res: Response
  ): Promise<Response> {
    const shorteningUrl = await this.utilitiesService.storeObject(persist, storeObjectDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.storeObject.success.storeObject,
      data: shorteningUrl
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  // Intent Template CRUD operations
  /**
   * Create a new intent template mapping
   * @param createIntentTemplateDto The intent template mapping details
   * @param res The response object
   * @returns The created intent template mapping
   */
  @Post('/intent-templates')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Create Intent Template', description: 'Create a new intent template mapping.' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Intent template created successfully',
    type: ApiResponseDto
  })
  async createIntentTemplate(
    @Body() createIntentTemplateDto: CreateIntentTemplateDto,
    @User() user: IUserRequest,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.utilitiesService.createIntentTemplate(createIntentTemplateDto, user);
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
  @Get('/intent-templates')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get All Intent Templates', description: 'Retrieve all intent template mappings.' })
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
      await this.utilitiesService.getAllIntentTemplatesByQuery(intentTemplateSearchCriteria);
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
  @Get('/intent-templates/by-intent-and-org')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Get Intent Template by Intent and Organization',
    description:
      'Retrieve intent template details by intent name and verifier organization ID. Returns org-specific template if mapped, otherwise returns global template.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template retrieved successfully', type: ApiResponseDto })
  async getIntentTemplateByIntentAndOrg(
    @Query() getIntentTemplateByIntentAndOrgDto: GetIntentTemplateByIntentAndOrgDto,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.utilitiesService.getIntentTemplateByIntentAndOrg(
      getIntentTemplateByIntentAndOrgDto.intentName,
      getIntentTemplateByIntentAndOrgDto.verifierOrgId
    );
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
  @Get('/intent-templates/intent/:intentId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Get Intent Templates by Intent ID',
    description: 'Retrieve all intent templates for a specific intent.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent templates retrieved successfully', type: ApiResponseDto })
  async getIntentTemplatesByIntentId(@Param('intentId') intentId: string, @Res() res: Response): Promise<Response> {
    const intentTemplates = await this.utilitiesService.getIntentTemplatesByIntentId(intentId);
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
  @Get('/intent-templates/org/:orgId')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({
    summary: 'Get Intent Templates by Organization ID',
    description: 'Retrieve all intent templates for a specific organization.'
  })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent templates retrieved successfully', type: ApiResponseDto })
  async getIntentTemplatesByOrgId(@Param('orgId') orgId: string, @Res() res: Response): Promise<Response> {
    const intentTemplates = await this.utilitiesService.getIntentTemplatesByOrgId(orgId);
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
  @Get('/intent-templates/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Get Intent Template by ID', description: 'Retrieve intent template details by ID.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template retrieved successfully', type: ApiResponseDto })
  async getIntentTemplateById(
    @Param(
      'id',
      new ParseUUIDPipe({
        exceptionFactory: (): Error => {
          throw new BadRequestException(ResponseMessages.oid4vpIntentToTemplate.error.invalidId);
        }
      })
    )
    id: string,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.utilitiesService.getIntentTemplateById(id);
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
  @Put('/intent-templates/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Update Intent Template', description: 'Update an existing intent template mapping.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template updated successfully', type: ApiResponseDto })
  async updateIntentTemplate(
    @Param('id') id: string,
    @Body() updateIntentTemplateDto: UpdateIntentTemplateDto,
    @User() user: IUserRequest,
    @Res() res: Response
  ): Promise<Response> {
    const intentTemplate = await this.utilitiesService.updateIntentTemplate(id, updateIntentTemplateDto, user);
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
  @Delete('/intent-templates/:id')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Delete Intent Template', description: 'Delete an intent template mapping.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Intent template deleted successfully', type: ApiResponseDto })
  async deleteIntentTemplate(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const intentTemplate = await this.utilitiesService.deleteIntentTemplate(id);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.OK,
      message: 'Intent template deleted successfully',
      data: intentTemplate
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
