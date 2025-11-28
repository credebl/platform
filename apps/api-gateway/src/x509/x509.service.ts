import { Inject } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { BaseService } from 'libs/service/base.service';

import { user } from '@prisma/client';

import { NATSClient } from '@credebl/common/NATSClient';
import {
  X509CreateCertificateOptionsDto,
  X509ImportCertificateOptionsDto,
  X509SearchCriteriaDto
} from './dtos/x509.dto';
import { X509CertificateRecord } from '@credebl/common/interfaces/x509.interface';

@Injectable()
export class X509Service extends BaseService {
  constructor(
    @Inject('NATS_CLIENT') private readonly serviceProxy: ClientProxy,
    private readonly natsClient: NATSClient
  ) {
    super('X509Service');
  }

  /**
   *
   * @param createDto
   * @returns X509 creation Success
   */
  async createX509(
    orgId: string,
    createDto: X509CreateCertificateOptionsDto,
    reqUser: user
  ): Promise<X509CertificateRecord> {
    this.logger.log(`Start creating x509 certficate`);
    const payload = { options: createDto, user: reqUser, orgId };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'create-x509-certificate', payload);
  }

  async activateX509(orgId: string, id: string, reqUser: user): Promise<X509CertificateRecord> {
    this.logger.log(`Start activating x509 certficate`);
    this.logger.debug(`certificate Id : `, id);
    const payload = { orgId, id, user: reqUser };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'activate-x509-certificate', payload);
  }

  async deActivateX509(orgId: string, id: string, reqUser: user): Promise<X509CertificateRecord> {
    this.logger.log(`Start deactivating x509 certficate`);
    this.logger.debug(`certificate Id : `, id);
    const payload = { orgId, id, user: reqUser };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'deActivate-x509-certificate', payload);
  }

  async getX509CertificatesByOrgId(
    orgId: string,
    x509SearchCriteriaDto: X509SearchCriteriaDto,
    reqUser: user
  ): Promise<X509CertificateRecord> {
    this.logger.log(`Start getting x509 certficate for org`);
    this.logger.debug(`Filters applied : `, x509SearchCriteriaDto);
    const payload = { orgId, options: x509SearchCriteriaDto, user: reqUser };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-all-certificates', payload);
  }

  async getX509Certificate(orgId: string, id: string, reqUser: user): Promise<X509CertificateRecord> {
    this.logger.log(`Start getting x509 certficate by id`);
    this.logger.debug(`certificate Id : `, id);
    const payload = { id, orgId, user: reqUser };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'get-certificate', payload);
  }

  /**
   *
   * @param importDto
   * @returns X509 import Success
   */
  async importX509(
    orgId: string,
    importDto: X509ImportCertificateOptionsDto,
    reqUser: user
  ): Promise<X509CertificateRecord> {
    this.logger.log(`Start importing x509 certficate by id`);
    this.logger.debug(`certificate  : `, importDto.certificate);
    const payload = { orgId, options: importDto, user: reqUser };
    return this.natsClient.sendNatsMessage(this.serviceProxy, 'import-x509-certificate', payload);
  }
}
