/* eslint-disable quotes */
/* eslint-disable no-useless-catch */
/* eslint-disable camelcase */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention, @typescript-eslint/explicit-function-return-type, @typescript-eslint/explicit-module-boundary-types, camelcase */

import {
  ConflictException,
  HttpException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { Oid4vpRepository } from './oid4vc-verification.repository';
import { CommonConstants } from '@credebl/common/common.constant';
import { ResponseMessages } from '@credebl/common/response-messages';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { getAgentUrl } from '@credebl/common/common.utils';
import { user } from '@prisma/client';
import { map } from 'rxjs';
import { CreateVerifier, VerifierRecord } from '@credebl/common/interfaces/oid4vp-verification';

@Injectable()
export class Oid4vpVerificationService {
  private readonly logger = new Logger('IssueCredentialService');
  constructor(
    @Inject('NATS_CLIENT') private readonly oid4vpVerificationServiceProxy: ClientProxy,
    private readonly oid4vpRepository: Oid4vpRepository
  ) {}

  async oid4vpCreateVerifier(createVerifier: CreateVerifier, orgId: string, userDetails: user): Promise<object> {
    try {
      let createdVerifierDetails;
      const { verifierId } = createVerifier;
      const checkIdExist = await this.oid4vpRepository.getVerifiersByPublicVerifierId(verifierId);
      if (0 < checkIdExist.length) {
        throw new ConflictException(ResponseMessages.oid4vp.error.verifierIdAlreadyExists);
      }
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;
      const url = await getAgentUrl(agentEndPoint, CommonConstants.OIDC_VERIFIER_CREATE);
      console.log('url:::', url);
      try {
        createdVerifierDetails = await this._createOid4vpVerifier(createVerifier, url, orgId);
        if (!createdVerifierDetails.response) {
          throw new InternalServerErrorException(ResponseMessages.oid4vp.error.createFailed);
        }
        createdVerifierDetails = createdVerifierDetails.response as VerifierRecord;
        console.log('createdVerifierDetails', createdVerifierDetails);
      } catch (error) {
        const status409 =
          409 === error?.status?.message?.statusCode || 409 === error?.response?.status || 409 === error?.statusCode;

        if (status409) {
          throw new ConflictException(`Verifier with id '${createdVerifierDetails.verifierId}' already exists`);
        }
        throw error;
      }
      const saveVerifierDetails = await this.oid4vpRepository.createOid4vpVerifier(
        createdVerifierDetails,
        id,
        userDetails.id
      );
      console.log('saveVerifierDetails', saveVerifierDetails);
      if (!saveVerifierDetails) {
        throw new InternalServerErrorException(ResponseMessages.oid4vp.error.createFailed);
      }
      return saveVerifierDetails;
    } catch (error) {
      this.logger.error(
        `[oid4vpCreateVerifier] - error in oid4vpCreateVerifier issuance records: ${JSON.stringify(error)}`
      );
      throw new RpcException(error?.response ?? error);
    }
  }

  async getVerifierById(verifierId: string): Promise<object> {
    try {
      const verifier = await this.oid4vpRepository.getVerifiersByPublicVerifierId(verifierId);
      if (!verifier || 0 === verifier.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      return verifier[0];
    } catch (error) {
      this.logger.error(`[getVerifierById] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async _createOid4vpVerifier(verifierDetails: CreateVerifier, url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-create-oid4vp-verifier' };
      const payload = { verifierDetails, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_createOID4VPVerifier] [NATS call]- error in create OID4VP Verifier : ${JSON.stringify(error)}`
      );
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
      return this.oid4vpVerificationServiceProxy
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
            error.error
          );
        });
    } catch (error) {
      this.logger.error(`[natsCall] - error in nats call : ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
