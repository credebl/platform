import { CountryInterface, StateInterface, CityInterface } from '@credebl/common/interfaces/geolocation.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';

@Injectable()
export class GeoLocationService extends BaseService {
  constructor(@Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy) {
    super('GeoLocationService');
  }

  /**
   *
   * @param
   * @returns Get all Countries list
   */
  async getAllCountries(): Promise<CountryInterface[]> {
    this.logger.log(`Finding all countries,GeoLocationService::getAllCountries`);
    try {
      return this.sendNatsMessage(this.serviceProxy, 'get-all-countries', '');
    } catch (error) {
      this.logger.error(`Error in get all countries::getAllCountries ${JSON.stringify(error)}`);
    }
  }

  /**
   *
   * @param
   * @returns Get all states list by using countryId
   */
  async getStatesByCountryId(countryId: string): Promise<StateInterface[]> {
    const payload = { countryId };
    try {
      this.logger.log(`Finding cities for countryId= ${countryId},GeoLocationService::getCitiesByStateAndCountry`);
      return this.sendNatsMessage(this.serviceProxy, 'get-all-states', payload);
    } catch (error) {
      this.logger.error(`Error in get all states::getStatesByCountryId ${JSON.stringify(error)}`);
    }
  }

  /**
   *
   * @param
   * @returns Get all cities list by using stateId and countryId
   */

  async getCitiesByStateAndCountry(countryId: string, stateId: string): Promise<CityInterface[]> {
    const payload = { countryId, stateId };
    try {
      this.logger.log(
        `Finding cities for stateId= ${stateId} and countryId= ${countryId},GeoLocationService::getCitiesByStateAndCountry`
      );
      return this.sendNatsMessage(this.serviceProxy, 'get-all-cities', payload);
    } catch (error) {
      this.logger.error(`Error in get all cities::getCitiesByStateAndCountry ${JSON.stringify(error)}`);
    }
  }
}
