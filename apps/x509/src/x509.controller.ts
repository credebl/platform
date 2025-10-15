import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { X509CertificateService } from './x509.service';
import { user } from '@prisma/client';
import { IUserRequest } from '@credebl/user-request/user-request.interface';
import {
  IX509ImportCertificateOptionsDto,
  IX509SearchCriteria,
  X509CertificateRecord,
  X509CreateCertificateOptions
} from '@credebl/common/interfaces/x509.interface';

@Controller()
export class X509CertificateController {
  constructor(private readonly x509CertificateService: X509CertificateService) {}

  @MessagePattern({ cmd: 'create-x509-certificate' })
  async createCertificate(payload: {
    orgId: string;
    options: X509CreateCertificateOptions;
    user: user;
  }): Promise<X509CertificateRecord> {
    return this.x509CertificateService.createCertificate(payload);
  }

  @MessagePattern({ cmd: 'activate-x509-certificate' })
  async activateCertificate(payload: { orgId: string; id: string; user: user }): Promise<X509CertificateRecord> {
    return this.x509CertificateService.activateCertificate(payload);
  }

  @MessagePattern({ cmd: 'deActivate-x509-certificate' })
  async deActivateCertificate(payload: { orgId: string; id: string; user: user }): Promise<X509CertificateRecord> {
    return this.x509CertificateService.deActivateCertificate(payload);
  }

  @MessagePattern({ cmd: 'get-all-certificates' })
  async getCertificateByOrgId(payload: {
    orgId: string;
    options: IX509SearchCriteria;
    user: IUserRequest;
  }): Promise<{ data: X509CertificateRecord[]; total: number }> {
    return this.x509CertificateService.getCertificateByOrgId(payload.orgId, payload.options);
  }

  @MessagePattern({ cmd: 'get-certificate' })
  async getCertificate(payload: { orgId: string; id: string; user: IUserRequest }): Promise<X509CertificateRecord> {
    return this.x509CertificateService.getCertificateById(payload.orgId, payload.id);
  }

  @MessagePattern({ cmd: 'import-x509-certificate' })
  async importCertificate(payload: {
    orgId: string;
    options: IX509ImportCertificateOptionsDto;
    user: user;
  }): Promise<X509CertificateRecord> {
    return this.x509CertificateService.importCertificate(payload);
  }
}
