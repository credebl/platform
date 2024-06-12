import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { Controller, UseFilters, Post, Body, Res, HttpStatus, Param, UseGuards } from '@nestjs/common';
import  IResponse from '@credebl/common/interfaces/response.interface';
import { Response } from 'express';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import { UnauthorizedErrorDto } from '../dtos/unauthorized-error.dto';
import { ForbiddenErrorDto } from '../dtos/forbidden-error.dto';
import { ResponseMessages } from '@credebl/common/response-messages';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';
import { StoreObjectDto, UtilitiesDto } from './dtos/shortening-url.dto';
import { UtilitiesService } from './utilities.service';
import { AuthGuard } from '@nestjs/passport';

@UseFilters(CustomExceptionFilter)
@Controller('utilities')
@ApiTags('utilities')
@ApiUnauthorizedResponse({ status: HttpStatus.UNAUTHORIZED, description: 'Unauthorized', type: UnauthorizedErrorDto })
@ApiForbiddenResponse({ status: HttpStatus.FORBIDDEN, description: 'Forbidden', type: ForbiddenErrorDto })
export class UtilitiesController {

  constructor(
    private readonly utilitiesService: UtilitiesService
  ) { }
  

  @Post('/')
  @ApiOperation({ summary: 'Create a shorteningurl', description: 'Create a shortening url' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  async createShorteningUrl(@Body() shorteningUrlDto: UtilitiesDto, @Res() res: Response): Promise<Response> {
    const shorteningUrl = await this.utilitiesService.createShorteningUrl(shorteningUrlDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.shorteningUrl.success.createShorteningUrl,
      data: shorteningUrl
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

  @Post('/store-object/:persist')
  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Store an object and return a short url to it', description: 'Create a short url representing the object' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'Created', type: ApiResponseDto })
  async storeObject(@Body() storeObjectDto: StoreObjectDto, @Param('persist') persist: boolean, @Res() res: Response): Promise<Response> {
    const shorteningUrl = await this.utilitiesService.storeObject(persist.valueOf(), storeObjectDto);
    const finalResponse: IResponse = {
      statusCode: HttpStatus.CREATED,
      message: ResponseMessages.storeObject.success.storeObject,
      data: shorteningUrl
    };
    return res.status(HttpStatus.CREATED).json(finalResponse);
  }

}

