import { EcosystemRepository } from 'apps/ecosystem/repositories/ecosystem.repository';
import { Injectable } from '@nestjs/common';

@Injectable()
export class EcosystemSwaggerFilter {
  constructor(private readonly ecosystemRepository: EcosystemRepository) {}
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async filterDocument(document: any): Promise<any> {
    const config = await this.ecosystemRepository.getPlatformConfig();
    const enabled = Boolean(config?.isEcosystemEnabled);

    if (!enabled) {
      Object.keys(document.paths).forEach((path) => {
        Object.keys(document.paths[path]).forEach((method) => {
          const operation = document.paths[path][method];

          if (operation.tags?.includes('ecosystem')) {
            delete document.paths[path][method];
          }
        });

        if (0 === Object.keys(document.paths[path]).length) {
          delete document.paths[path];
        }
      });
    }

    return document;
  }
}
