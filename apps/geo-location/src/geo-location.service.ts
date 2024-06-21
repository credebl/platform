import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { CountryInterface, StateInterface, CityInterface } from '@credebl/common/interfaces/geolocation.interface';
import { GeoLocationRepository } from './geo-location.repository';

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
        throw new RpcException(`No states found for countryId: ${countryId}.Please provide valid countryId`);
      }
      return states;
    } catch (error) {
      this.logger.error(`[getStatesByCountryId] - error in get states by countryId:: ${JSON.stringify(error)}`);
      throw new RpcException(error);
    }
  }

  async getCitiesByStateAndCountry(countryId: number, stateId: number): Promise<CityInterface[]> {
    try {
      this.logger.log(
        `Inside Service: finding all cities for stateId= ${stateId} and countryId= ${countryId},GeoLocationService::getCitiesByStateAndCountry`
      );
      const cities = await this.geoLocationRepository.findCitiesByStateAndCountry(countryId, stateId);
      if (!cities.length) {
        throw new RpcException(
          `No cities found for stateId ${stateId} and countryId ${countryId}.Please provide valid stateId and countryId`
        );
      }
      return cities;
    } catch (error) {
      this.logger.error(
        `[getCitiesByStateAndCountry] - error in get cities by using countryId and stateId:: ${JSON.stringify(error)}`
      );
      throw new RpcException(error);
    }
  }
}
