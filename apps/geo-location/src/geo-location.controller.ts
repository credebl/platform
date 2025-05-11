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
  async getStatesByCountryId(payload: { countryId: number }): Promise<StateInterface[]> {
    return this.geoLocationService.getStatesByCountryId(payload.countryId);
  }

  @MessagePattern({ cmd: 'get-all-cities' })
  async getCitiesByStateAndCountry(payload: { countryId: number; stateId: number }): Promise<CityInterface[]> {
    return this.geoLocationService.getCitiesByStateAndCountry(payload.countryId, payload.stateId);
  }
}
