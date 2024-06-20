import { Controller } from '@nestjs/common';
import { GeoLocationService } from './geo-location.service';
import { MessagePattern } from '@nestjs/microservices';
import { CountryInterface, StateInterface, CityInterface } from '@credebl/common/interfaces/geolocation.interface';

@Controller()
export class GeoLocationController {
  constructor(private readonly geoLocationService: GeoLocationService) {}

  @MessagePattern({ cmd: 'get-all-countries' })
  async getAllCountries(): Promise<CountryInterface[]> {
    return this.geoLocationService.getAllCountries();
  }

  @MessagePattern({ cmd: 'get-all-states' })
  async getStatesByCountryId(payload: { countryId: string }): Promise<StateInterface[]> {
    return this.geoLocationService.getStatesByCountryId(payload);
  }

  @MessagePattern({ cmd: 'get-all-cities' })
  async getCitiesByStateAndCountry(payload: { countryId: string; stateId: string }): Promise<CityInterface[]> {
    return this.geoLocationService.getCitiesByStateAndCountry(payload);
  }
}
