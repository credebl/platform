// eslint-disable-next-line camelcase
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EcosystemRepository } from './ecosystem.repository';
import { ResponseMessages } from '@credebl/common/response-messages';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class EcosystemService {
  constructor(
    private readonly ecosystemRepository: EcosystemRepository,
    private readonly logger: Logger

  ) { }

  /**
   *
   * @param createEcosystemDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async createEcosystem(createEcosystemDto): Promise<object> {
      const createEcosystem = await this.ecosystemRepository.createNewEcosystem(createEcosystemDto);
      if (!createEcosystem) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.update);
      }
      return createEcosystem;
  }


  /**
  *
  * @param editEcosystemDto
  * @returns
  */

  // eslint-disable-next-line camelcase
  async editEcosystem(editEcosystemDto, ecosystemId): Promise<object> {
    const editOrganization = await this.ecosystemRepository.updateEcosystemById(editEcosystemDto, ecosystemId);
    if (!editOrganization) {
      throw new NotFoundException(ResponseMessages.ecosystem.error.update);
    }
    return editOrganization;
  }

  /**
   *
   *
   * @returns all ecosystem details
   */

  // eslint-disable-next-line camelcase
  async getAllEcosystem(): Promise<object> {
      const getAllEcosystemDetails = await this.ecosystemRepository.getAllEcosystemDetails();
      if (!getAllEcosystemDetails) {
        throw new NotFoundException(ResponseMessages.ecosystem.error.update);
      }
      return getAllEcosystemDetails;
    } 
}
