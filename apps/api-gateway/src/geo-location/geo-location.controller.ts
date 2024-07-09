import { Controller, Get, HttpStatus, Logger, Param, Res, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GeoLocationService } from './geo-location.service';
import { ApiResponseDto } from '../dtos/apiResponse.dto';
import IResponseType from '@credebl/common/interfaces/response.interface';
import { ResponseMessages } from '@credebl/common/response-messages';
import { Response } from 'express';
import { CustomExceptionFilter } from 'apps/api-gateway/common/exception-handler';

@UseFilters(CustomExceptionFilter)
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
  @ApiOperation({ summary: 'Retrieve a list of all countries', description: 'Fetches and returns the details of all available countries.' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async getAllCountries(@Res() res: Response): Promise<Response> {
    const countriesDetails = await this.geolocationService.getAllCountries();
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.geolocation.success.countriesVerificationCode,
      data: countriesDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }

  /**
   * @returns get all states by countryId
   */

  @Get('countries/:countryId/states')
  @ApiOperation({summary: 'Retrieve a list of all states within a specified country', description: 'Fetches and returns the details of all states associated with a given countryId. '
  })
  @ApiResponse({status: HttpStatus.OK, description: 'Success', type: ApiResponseDto})
  async getStatesByCountryId(@Param('countryId') countryId: number, @Res() res: Response): Promise<Response> {
    const statesDetails = await this.geolocationService.getStatesByCountryId(countryId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.geolocation.success.stateVerificationCode,
      data: statesDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
  /**
   * @returns get all cities by countryId and stateId
   */
  @Get('countries/:countryId/states/:stateId/cities')
  @ApiOperation({summary: 'Retrieve a list of all cities within a specified state and country', description: 'Fetches and returns the details of all cities associated with a given countryId and stateId'})
  @ApiResponse({ status: HttpStatus.OK, description: 'Success', type: ApiResponseDto })
  async getCitiesByStateAndCountry(@Param('countryId') countryId: number, @Param('stateId') stateId: number, @Res() res: Response): Promise<Response> {
    const citiesDetails = await this.geolocationService.getCitiesByStateAndCountry(countryId, stateId);
    const finalResponse: IResponseType = {
      statusCode: HttpStatus.OK,
      message: ResponseMessages.geolocation.success.cityVerificationCode,
      data: citiesDetails
    };
    return res.status(HttpStatus.OK).json(finalResponse);
  }
}
