// eslint-disable-next-line camelcase
import { Injectable} from '@nestjs/common';

@Injectable()
export class EcosystemService {
  constructor(  
  ) { }

  /**
   *
   * @param registerOrgDto
   * @returns
   */

  // eslint-disable-next-line camelcase
  async createEcosystem():Promise<string> {
    return "test ecosystem";
  }

}
