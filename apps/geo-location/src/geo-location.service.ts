import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CountryInterface, StateInterface, CityInterface } from '@credebl/common/interfaces/geolocation.interface';
import { GeoLocationRepository } from './geo-location.repository';
import { ResponseMessages } from '@credebl/common/response-messages';

@Injectable()
export class GeoLocationService {
  constructor(
    private readonly logger: Logger,
    private readonly geoLocationRepository: GeoLocationRepository
  ) {}

  async getAllCountries(): Promise<CountryInterface[]> {
    try {
      this.logger.log(`Inside Service: finding all countries,GeoLocationService::getAllCountries`);
      return this.geoLocationRepository.findAllCountries();
    } catch (error) {
      this.logger.error(`[getAllCountries] - error in get all countries:: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async getStatesByCountryId(countryId: number): Promise<StateInterface[]> {
    try {
      this.logger.log(
        `Inside Service: finding all states for countryId= ${countryId},GeoLocationService::getStatesByCountryId`
      );
      const states = await this.geoLocationRepository.findStatesByCountryId(countryId);

      if (!states.length) {
        throw new NotFoundException(ResponseMessages.geolocation.error.stateNotFound);
      }
      return states;
    } catch (error) {
      this.logger.error(`[getStatesByCountryId] - error in get states by countryId:: ${JSON.stringify(error)}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getCitiesByStateAndCountry(countryId: number, stateId: number): Promise<CityInterface[]> {
    try {
      this.logger.log(
        `Inside Service: finding all cities for stateId= ${stateId} and countryId= ${countryId},GeoLocationService::getCitiesByStateAndCountry`
      );
      const cities = await this.geoLocationRepository.findCitiesByStateAndCountry(countryId, stateId);
      if (!cities.length) {
        throw new NotFoundException(ResponseMessages.geolocation.error.citiesNotFound);
      }
      return cities;
    } catch (error) {
      this.logger.error(
        `[getCitiesByStateAndCountry] - error in get cities by using countryId and stateId:: ${JSON.stringify(error)}`
      );
      throw new RpcException(error.response ? error.response : error);
    }
  }
}
