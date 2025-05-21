import type IResponse from '@credebl/common/interfaces/response.interface'
import { ResponseMessages } from '@credebl/common/response-messages'
import { Body, Controller, HttpStatus, Param, Post, Res, UseFilters, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger'
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler'
import type { Response } from 'express'
import { ApiResponseDto } from '../dtos/apiResponse.dto'
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto'
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto'
import type { StoreObjectDto, UtilitiesDto } from './dtos/shortening-url.dto'
import type { UtilitiesService } from './utilities.service'

@UseFilters(CustomExceptionFilter)
@Controller('utilities')
@ApiTags('utilities')
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
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
    const shorteningUrl = await this.utilitiesService.createShorteningUrl(shorteningUrlDto)
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.shorteningUrl.success.createShorteningUrl,
      data: shorteningUrl,
    }
    return res.status(HttpStatus.CREATED).json(finalResponse)
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
    description: 'Store an object and create a short URL representing the object.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Object stored and short URL created successfully',
    type: ApiResponseDto,
  })
  async storeObject(
    @Body() storeObjectDto: StoreObjectDto,
    @Param('persist') persist: boolean,
    @Res() res: Response
  ): Promise<Response> {
    const shorteningUrl = await this.utilitiesService.storeObject(persist.valueOf(), storeObjectDto)
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.storeObject.success.storeObject,
      data: shorteningUrl,
    }
    return res.status(HttpStatus.CREATED).json(finalResponse)
  }
}
