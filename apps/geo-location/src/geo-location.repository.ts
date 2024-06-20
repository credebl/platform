import { CountryInterface, StateInterface, CityInterface } from '@credebl/common/interfaces/geolocation.interface';
import { PrismaService } from '@credebl/prisma-service';
import { Injectable, Logger } from '@nestjs/common';

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
          name: true
        }
      });
    } catch (error) {
      this.logger.error(`Error in GeoLocationRepository::[findAllCountries]: ${error}`);
      throw error;
    }
  }
  async findStatesByCountryId(countryId: string): Promise<StateInterface[]> {
    try {
      return await this.prisma.states.findMany({
        where: { countryId: Number(countryId) },
        select: {
          id: true,
          name: true,
          countryId: true,
          countryCode: true
        }
      });
    } catch (error) {
      this.logger.error(`Error in GeoLocationRepository::[findStatesByCountryId]: ${error} `);
      throw error;
    }
  }

  async findCitiesByStateAndCountry(countryId: string, stateId: string): Promise<CityInterface[]> {
    try {
      return await this.prisma.cities.findMany({
        where: {
          stateId: Number(stateId),
          countryId: Number(countryId)
        },
        select: {
          id: true,
          name: true,
          stateId: true,
          stateCode: true,
          countryId: true,
          countryCode: true
        }
      });
    } catch (error) {
      this.logger.error(`Error finding cities for stateId ${stateId} and countryId ${countryId}: ${error}`);
      throw error;
    }
  }
}
