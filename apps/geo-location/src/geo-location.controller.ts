import type { CityInterface, CountryInterface, StateInterface } from '@credebl/common/interfaces/geolocation.interface'
import { Controller } from '@nestjs/common'
import { MessagePattern } from '@nestjs/microservices'
import type { GeoLocationService } from './geo-location.service'

@Controller()
export class GeoLocationController {
  constructor(private readonly geoLocationService: GeoLocationService) {}

  @MessagePattern({ cmd: 'get-all-countries' })
  async getAllCountries(): Promise<CountryInterface[]> {
    return this.geoLocationService.getAllCountries()
  }

  @MessagePattern({ cmd: 'get-all-states' })
  async getStatesByCountryId(payload: { countryId: number }): Promise<StateInterface[]> {
    return this.geoLocationService.getStatesByCountryId(payload.countryId)
  }

  @MessagePattern({ cmd: 'get-all-cities' })
  async getCitiesByStateAndCountry(payload: { countryId: number; stateId: number }): Promise<CityInterface[]> {
    return this.geoLocationService.getCitiesByStateAndCountry(payload.countryId, payload.stateId)
  }
}
