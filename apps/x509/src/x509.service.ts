// src/services/x509-certificate.service.ts
import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common';
import { BaseService } from 'libs/service/base.service';
import { X509CertificateRepository } from './repositories/x509.repository';
import { user } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { map } from 'rxjs';
import {
  IX509ImportCertificateOptionsDto,
  IX509SearchCriteria,
  x509CertificateDecodeDto,
  X509CertificateRecord,
  X509CreateCertificateOptions
} from '@credebl/common/interfaces/x509.interface';
import {
  CertificateDateCheckDto,
  CreateX509CertificateEntity,
  UpdateCertificateStatusDto
} from './interfaces/x509.interface';
import { getAgentUrl } from '@credebl/common/common.utils';
import { CommonConstants } from '@credebl/common/common.constant';
import { ResponseMessages } from '@credebl/common/response-messages';
import { x5cKeyType, x5cRecordStatus } from '@credebl/enum/enum';

@Injectable()
export class X509CertificateService extends BaseService {
  constructor(
    private readonly x509CertificateRepository: X509CertificateRepository,
    @Inject('NATS_CLIENT') private readonly x509ServiceProxy: ClientProxy
  ) {
    super('x509Service');
  }

  async createCertificate(payload: {
    orgId: string;
    options: X509CreateCertificateOptions;
    user: user;
  }): Promise<X509CertificateRecord> {
    try {
      this.logger.log(`Start creating x509 certificate`);
      this.logger.debug(`Create x509 certificate with options`, payload);
      const { options, user, orgId } = payload;
      const url = getAgentUrl(await this.getAgentEndpoint(orgId), CommonConstants.X509_CREATE_CERTIFICATE);

      const certificateDateCheckDto: CertificateDateCheckDto = {
        orgId,
        validFrom: options.validity.notBefore,
        expiry: options.validity.notAfter,
        keyType: options.authorityKey.keyType,
        status: x5cRecordStatus.Active
      };
      const collisionForActiveRecords = await this.x509CertificateRepository.hasDateCollision(certificateDateCheckDto);

      let certStatus: x5cRecordStatus;
      if (collisionForActiveRecords.hasCollision) {
        certificateDateCheckDto.status = x5cRecordStatus.PendingActivation;
        const collisionForPendingRecords =
          await this.x509CertificateRepository.hasDateCollision(certificateDateCheckDto);

        if (collisionForPendingRecords.hasCollision) {
          this.logger.log(`Creating x509 certificate has collision`);
          this.logger.error(`Collision records`, collisionForActiveRecords);
          throw new ConflictException(ResponseMessages.x509.error.collision);
        }

        certStatus = x5cRecordStatus.PendingActivation;
      } else {
        certStatus = x5cRecordStatus.Active;
      }

      const certificate = await this._createX509CertificateForOrg(options, url, orgId);
      if (!certificate) {
        throw new NotFoundException(ResponseMessages.x509.error.errorCreate);
      }

      const createDto: CreateX509CertificateEntity = {
        orgId,
        certificateBase64: certificate.response.publicCertificateBase64,
        keyType: options.authorityKey.keyType,
        status: certStatus,
        validFrom: options.validity.notBefore,
        expiry: options.validity.notAfter,
        createdBy: user.id,
        lastChangedBy: user.id
      };

      return await this.x509CertificateRepository.create(createDto);
    } catch (error) {
      this.logger.error(`Error in createCertificate: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async activateCertificate(payload: { orgId: string; id: string; user: user }): Promise<X509CertificateRecord> {
    const { orgId, user, id } = payload;
    const certificateRecord = await this.x509CertificateRepository.findById(orgId, id);
    if (certificateRecord) {
      const certificateDateCheckDto: CertificateDateCheckDto = {
        orgId,
        validFrom: certificateRecord.validFrom,
        expiry: certificateRecord.expiry,
        keyType: certificateRecord.keyType as x5cKeyType,
        status: x5cRecordStatus.Active,
        excludeCertificateId: id
      };
      const collisionForActiveRecords = await this.x509CertificateRepository.hasDateCollision(certificateDateCheckDto);
      if (collisionForActiveRecords.hasCollision) {
        throw new ConflictException(
          `${ResponseMessages.x509.error.collisionForActivatingX5c}. Conflict Records:[${collisionForActiveRecords.collisions.map((collision) => collision.id)}]`
        );
      }
      const statusDto: UpdateCertificateStatusDto = {
        status: x5cRecordStatus.Active,
        lastChangedBy: user.id
      };

      return this.x509CertificateRepository.updateStatus(id, statusDto);
    }

    throw new NotFoundException(ResponseMessages.x509.error.notFound);
  }

  async deActivateCertificate(payload: { orgId: string; id: string; user: user }): Promise<X509CertificateRecord> {
    const { orgId, user, id } = payload;
    const certificateRecord = await this.x509CertificateRepository.findById(orgId, id);
    if (certificateRecord) {
      const statusDto: UpdateCertificateStatusDto = {
        status: x5cRecordStatus.InActive,
        lastChangedBy: user.id
      };

      return this.x509CertificateRepository.updateStatus(id, statusDto);
    }
    throw new NotFoundException(ResponseMessages.x509.error.notFound);
  }

  async importCertificate(payload: {
    orgId: string;
    options: IX509ImportCertificateOptionsDto;
    user: user;
  }): Promise<X509CertificateRecord> {
    try {
      const { options, user, orgId } = payload;
      const url = getAgentUrl(await this.getAgentEndpoint(orgId), CommonConstants.X509_DECODE_CERTIFICATE);

      this.logger.log(`Decoding certificate to import`);
      const decodedResult = await this._decodeX509CertificateForOrg({ certificate: options.certificate }, url, orgId);
      if (!decodedResult || !decodedResult.response) {
        this.logger.error(`Failed to decode certificate`);
        throw new NotFoundException(ResponseMessages.x509.error.errorDecode);
      }

      this.logger.log(`Decoded certificate`);
      this.logger.debug(`certificate data:`, JSON.stringify(decodedResult));

      const { publicKey } = decodedResult.response;
      const decodedCert = decodedResult.response.x509Certificate;

      this.logger.log(`Start validating certificate`);
      const isValidKeyType = Object.values(x5cKeyType).includes(publicKey.keyType as x5cKeyType);

      if (!isValidKeyType) {
        this.logger.error(`keyType is not valid for importing certificate`);
        throw new InternalServerErrorException(ResponseMessages.x509.error.import);
      }

      const validFrom = new Date(decodedCert.notBefore);
      const expiry = new Date(decodedCert.notAfter);
      const certificateDateCheckDto: CertificateDateCheckDto = {
        orgId,
        validFrom,
        expiry,
        keyType: publicKey.keyType,
        status: x5cRecordStatus.Active
      };
      const collisionForActiveRecords = await this.x509CertificateRepository.hasDateCollision(certificateDateCheckDto);

      let certStatus: x5cRecordStatus;
      if (collisionForActiveRecords.hasCollision) {
        certificateDateCheckDto.status = x5cRecordStatus.PendingActivation;
        const collisionForPendingRecords =
          await this.x509CertificateRepository.hasDateCollision(certificateDateCheckDto);

        if (collisionForPendingRecords.hasCollision) {
          this.logger.log(`Importing x509 certificate has collision`);
          this.logger.error(`Collision records`, collisionForPendingRecords);
          throw new UnprocessableEntityException(ResponseMessages.x509.error.collision);
        }
        certStatus = x5cRecordStatus.PendingActivation;
      } else {
        certStatus = x5cRecordStatus.Active;
      }
      const importurl = getAgentUrl(await this.getAgentEndpoint(orgId), CommonConstants.X509_IMPORT_CERTIFICATE);

      this.logger.log(`Certificate validation done`);
      const certificate = await this._importX509CertificateForOrg(options, importurl, orgId);
      if (!certificate) {
        throw new NotFoundException(ResponseMessages.x509.error.errorCreate);
      }
      this.logger.log(`Successfully imported certificate in wallet `);
      const createDto: CreateX509CertificateEntity = {
        orgId,
        certificateBase64: certificate.response.issuerCertficicate,
        keyType: publicKey.keyType,
        status: certStatus,
        validFrom,
        expiry,
        createdBy: user.id,
        lastChangedBy: user.id
      };
      this.logger.log(`Now adding certificate in platform for org : ${orgId} `);

      return await this.x509CertificateRepository.create(createDto);
    } catch (error) {
      this.logger.error(`Error in importing certificate: ${error}`);
      throw new RpcException(error.response ? error.response : error);
    }
  }

  async getCertificateByOrgId(
    orgId: string,
    options: IX509SearchCriteria
  ): Promise<{ data: X509CertificateRecord[]; total: number }> {
    return this.x509CertificateRepository.findAll({
      orgId,
      keyType: options.keyType,
      status: options.status,
      limit: options.pageSize,
      page: options.pageNumber
    });
  }

  async getCertificateById(orgId: string, id: string): Promise<X509CertificateRecord> {
    return this.x509CertificateRepository.findById(orgId, id);
  }

  async _createX509CertificateForOrg(
    options: X509CreateCertificateOptions,
    url: string,
    orgId: string
  ): Promise<{
    response;
  }> {
    try {
      const pattern = { cmd: 'agent-create-x509-certificate' };
      const payload = { options, url, orgId };
      this.logger.log(`Requesing agent service for create x509 certificate`);
      this.logger.debug(`agent service payload - _createX509CertificateForOrg : `, payload);
      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_createX509CertificateForOrg] [NATS call]-  : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _decodeX509CertificateForOrg(
    options: x509CertificateDecodeDto,
    url: string,
    orgId: string
  ): Promise<{
    response;
  }> {
    try {
      const pattern = { cmd: 'agent-decode-x509-certificate' };
      const payload = { options, url, orgId };
      this.logger.log(`Requesing agent service for decode x509 certificate`);
      this.logger.debug(`agent service payload - _decodeX509CertificateForOrg : `, payload);
      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_decodeX509CertificateForOrg] [NATS call]-  : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async _importX509CertificateForOrg(
    options: IX509ImportCertificateOptionsDto,
    url: string,
    orgId: string
  ): Promise<{
    response;
  }> {
    try {
      const pattern = { cmd: 'agent-import-x509-certificate' };
      const payload = { options, url, orgId };
      this.logger.log(`Requesing agent service for importing x509 certificate`);
      this.logger.debug(`agent service payload - _importX509CertificateForOrg : `, payload);
      return await this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(`[_importX509CertificateForOrg] [NATS call]-  : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async natsCall(
    pattern: object,
    payload: object
  ): Promise<{
    response: string;
  }> {
    try {
      return this.x509ServiceProxy
        .send<string>(pattern, payload)
        .pipe(
          map((response) => ({
            response
          }))
        )
        .toPromise()
        .catch((error) => {
          this.logger.error(`catch: ${JSON.stringify(error)}`);
          throw new HttpException(
            {
              status: error.statusCode,
              error: error.message
            },
            error.statusCode
          );
        });
    } catch (error) {
      this.logger.error(`[natsCall] - error in nats call : ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async getAgentEndpoint(orgId: string): Promise<string> {
    const agentDetails = await this.x509CertificateRepository.getAgentEndPoint(orgId);

    if (!agentDetails) {
      throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
    }

    if (!agentDetails.agentEndPoint || '' === agentDetails.agentEndPoint.trim()) {
      throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
    }

    return agentDetails.agentEndPoint;
  }
}
