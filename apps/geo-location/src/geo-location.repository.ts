import type { CityInterface, CountryInterface, StateInterface } from '@credebl/common/interfaces/geolocation.interface'
import type { PrismaService } from '@credebl/prisma-service'
import { Injectable, type Logger } from '@nestjs/common'

@Injectable()
export class GeoLocationRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger
  ) {}

  async findAllCountries(): Promise<CountryInterface[]> {
    try {
      return await this.prisma.countries.findMany({
        select: {
          id: true,
          name: true,
        },
      })
    } catch (error) {
      this.logger.error(`Error in GeoLocationRepository::[findAllCountries]: ${error}`)
      throw error
    }
  }
  async findStatesByCountryId(countryId: number): Promise<StateInterface[]> {
    try {
      return await this.prisma.states.findMany({
        where: { countryId: Number(countryId) },
        select: {
          id: true,
          name: true,
          countryId: true,
          countryCode: true,
        },
      })
    } catch (error) {
      this.logger.error(`Error in GeoLocationRepository::[findStatesByCountryId]: ${error} `)
      throw error
    }
  }

  async findCitiesByStateAndCountry(countryId: number, stateId: number): Promise<CityInterface[]> {
    try {
      return await this.prisma.cities.findMany({
        where: {
          stateId: Number(stateId),
          countryId: Number(countryId),
        },
        select: {
          id: true,
          name: true,
          stateId: true,
          stateCode: true,
          countryId: true,
          countryCode: true,
        },
      })
    } catch (error) {
      this.logger.error(`Error finding cities for stateId ${stateId} and countryId ${countryId}: ${error}`)
      throw error
    }
  }
}
