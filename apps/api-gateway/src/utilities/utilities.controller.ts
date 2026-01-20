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
  Query
} from '@nestjs/common';
import IResponse from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { StoreObjectDto, UtilitiesDto } from './dtos/shortening-url.dto';
import { GetAllIntentTemplatesDto } from './dtos/get-all-intent-templates.dto';
import { GetIntentTemplateByIntentAndOrgDto } from './dtos/get-intent-template-by-intent-and-org.dto';
import { GetAllIntentTemplatesResponseDto } from './dtos/get-all-intent-templates-response.dto';
import { UtilitiesService } from './utilities.service';
import { IIntentTemplateList } from '@credebl/common/interfaces/intents-template.interface';
import { AuthGuard } from '@nestjs/passport';

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
}
