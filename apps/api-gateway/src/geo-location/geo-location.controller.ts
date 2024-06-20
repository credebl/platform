import { Controller, Get, HttpStatus, Logger, Param, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GeoLocationService } from './geo-location.service';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Response } from 'express';
@Controller('/')
@ApiTags('geolocation')
export class GeoLocationController {
  constructor(
    private readonly geolocationService: GeoLocationService,
    private readonly logger: Logger
  ) {}

  /**
   * @returns get all countries
   */
  @Get('countries')
  @ApiOperation({ summary: 'Get all countries', description: 'Get all countries' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async getAllCountries(@Res() res: Response): Promise<Response> {
    const countriesDetails = await this.geolocationService.getAllCountries();
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.countriesVerificationCode,
      data: countriesDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * @returns get all states by countryId
   */

  @Get('countries/:countryId/states')
  @ApiOperation({summary: 'Get all states by using countryId ', description: 'Get all states by using countryId '
  })
  @ApiResponse({status: HttpStatus.OK, description: 'Success', type: ApiResponseDto})
  async getStatesByCountryId(@Param('countryId') countryId: string, @Res() res: Response): Promise<Response> {
    const statesDetails = await this.geolocationService.getStatesByCountryId(countryId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.stateVerificationCode,
      data: statesDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
  /**
   * @returns get all cities by countryId and stateId
   */
  @Get('countries/:countryId/states/:stateId/cities')
  @ApiOperation({summary: 'Get all cities by using countryId and stateId', description: 'Get all cities by using countryId and stateId'})
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async getCitiesByStateAndCountry(@Param('countryId') countryId: string, @Param('stateId') stateId: string, @Res() res: Response): Promise<Response> {
    const citiesDetails = await this.geolocationService.getCitiesByStateAndCountry(countryId, stateId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.user.success.cityVerificationCode,
      data: citiesDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
