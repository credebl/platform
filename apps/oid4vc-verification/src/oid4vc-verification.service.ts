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
import { CreateVerifier, UpdateVerifier, VerifierRecord } from '@credebl/common/interfaces/oid4vp-verification';
import { buildUrlWithQuery } from '@credebl/common/cast.helper';
import { VerificationSessionQuery } from '../interfaces/oid4vp-verifier.interfaces';
import { RequestSignerMethod } from '@credebl/enum/enum';

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

  async oid4vpUpdateVerifier(
    updateVerifier: UpdateVerifier,
    orgId: string,
    verifierId: string,
    userDetails: user
  ): Promise<object> {
    try {
      let updatedVerifierDetails;
      const existingVerifiers = await this.oid4vpRepository.getVerifiersByVerifierId(verifierId);
      if (0 > existingVerifiers.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      // updateVerifier['verifierId'] = existingVerifiers[0].publicVerifierId
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;
      const url = await getAgentUrl(
        agentEndPoint,
        CommonConstants.OIDC_VERIFIER_UPDATE,
        existingVerifiers[0].publicVerifierId
      );
      console.log('url:::', url);
      try {
        updatedVerifierDetails = await this._updateOid4vpVerifier(updateVerifier, url, orgId);
        if (!updatedVerifierDetails.response) {
          throw new InternalServerErrorException(ResponseMessages.oid4vp.error.updateFailed);
        }
        updatedVerifierDetails = updatedVerifierDetails.response.data as VerifierRecord;
      } catch (error) {
        // We'll not need this
        const status409 =
          409 === error?.status?.message?.statusCode || 409 === error?.response?.status || 409 === error?.statusCode;

        if (status409) {
          throw new ConflictException(`Verifier with id '${updatedVerifierDetails.verifierId}' already exists`);
        }
        throw error;
      }
      const updateVerifierDetails = await this.oid4vpRepository.updateOid4vpVerifier(
        updatedVerifierDetails,
        userDetails.id,
        verifierId
      );
      if (!updateVerifierDetails) {
        throw new InternalServerErrorException(ResponseMessages.oid4vp.error.updateFailed);
      }
      return updateVerifierDetails;
    } catch (error) {
      this.logger.error(`[oid4vpUpdateVerifier] - error in oid4vpUpdateVerifier records: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async getVerifierById(orgId: string, verifierId?: string): Promise<object> {
    try {
      const verifiers = await this.oid4vpRepository.getVerifiersByVerifierId(orgId, verifierId);
      if (!verifiers || 0 === verifiers.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      return verifiers;
    } catch (error) {
      this.logger.error(`[getVerifierById] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async deleteVerifierById(orgId: string, verifierId: string): Promise<object> {
    try {
      const checkIdExist = await this.oid4vpRepository.getVerifiersByVerifierId(orgId, verifierId);
      if (0 == checkIdExist.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }

      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;
      const url = await getAgentUrl(agentEndPoint, CommonConstants.OIDC_VERIFIER_DELETE, checkIdExist[0].verifierId);
      console.log('url:::', url);

      await this._deleteOid4vpVerifier(url, orgId);

      const verifier = await this.oid4vpRepository.deleteVerifierByVerifierId(orgId, verifierId);
      return verifier;
    } catch (error) {
      this.logger.error(`[deleteVerifierById] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error.error ?? error);
    }
  }

  async oid4vpCreateVerificationSession(orgId, verifierId, sessionRequest, userDetails: user): Promise<object> {
    try {
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, orgDid } = agentDetails;

      const getVerifierDetails = await this.oid4vpRepository.getVerifierById(orgId, verifierId);

      if (!getVerifierDetails) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      sessionRequest.verifierId = getVerifierDetails.publicVerifierId;
      if (RequestSignerMethod.DID === sessionRequest.requestSigner.method) {
        sessionRequest.requestSigner.didUrl = orgDid;
      } else if (RequestSignerMethod.X509 === sessionRequest.requestSigner.method) {
        throw new NotFoundException('X509 request signer method not implemented yet');
      }
      const url = await getAgentUrl(agentEndPoint, CommonConstants.OID4VP_VERIFICATION_SESSION);
      this.logger.log(`[oid4vpCreateVerificationSession] calling agent url: ${url}`);
      const createdSession = await this._createVerificationSession(sessionRequest, url, orgId);
      if (!createdSession?.response) {
        throw new InternalServerErrorException(ResponseMessages.oid4vp.error.createFailed);
      }

      return createdSession.response;
    } catch (error) {
      this.logger.error(
        `[oid4vpCreateVerificationSession] - error creating verification session: ${JSON.stringify(error)}`
      );
      throw new RpcException(error?.response ?? error);
    }
  }

  async getVerifierSession(orgId: string, query?: VerificationSessionQuery): Promise<object> {
    try {
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;

      let url = query.id
        ? getAgentUrl(agentEndPoint, CommonConstants.OIDC_VERIFIER_SESSION_GET_BY_ID, query.id)
        : getAgentUrl(agentEndPoint, CommonConstants.OIDC_VERIFIER_SESSION_GET_BY_QUERY);

      if (!query.id) {
        url = buildUrlWithQuery(url, query);
      }
      console.log('url:::', url);

      const verifiers = await await this._getOid4vpVerifierSession(url, orgId);
      if (!verifiers || 0 === verifiers.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      return verifiers;
    } catch (error) {
      this.logger.error(`[getVerifierSession] - error: ${JSON.stringify(error)}`);
      throw new RpcException(error?.response ?? error);
    }
  }

  async getVerificationSessionResponse(orgId: string, verificationSessionId: string): Promise<object> {
    try {
      const agentDetails = await this.oid4vpRepository.getAgentEndPoint(orgId);
      if (!agentDetails) {
        throw new NotFoundException(ResponseMessages.issuance.error.agentEndPointNotFound);
      }
      const { agentEndPoint, id } = agentDetails;

      const url = getAgentUrl(agentEndPoint, CommonConstants.OIDC_VERIFIER_SESSION_GET_BY_ID, verificationSessionId);
      console.log('url:::', url);

      const verifiers = await await this._getOid4vpVerifierSession(url, orgId);
      if (!verifiers || 0 === verifiers.length) {
        throw new NotFoundException(ResponseMessages.oid4vp.error.notFound);
      }
      return verifiers;
    } catch (error) {
      this.logger.error(`[getVerificationSessionResponse] - error: ${JSON.stringify(error)}`);
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

  async _deleteOid4vpVerifier(url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-delete-oid4vp-verifier' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_deleteOid4vpVerifier] [NATS call]- error in delete OID4VP Verifier : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _updateOid4vpVerifier(verifierDetails: UpdateVerifier, url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-update-oid4vp-verifier' };
      const payload = { verifierDetails, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_updateOid4vpVerifier] [NATS call]- error in update OID4VP Verifier : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _createVerificationSession(sessionRequest: any, url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-create-oid4vp-verification-session' };
      const payload = { sessionRequest, url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_createVerificationSession] [NATS call]- error in create verification session : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _getOid4vpVerifierSession(url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-get-oid4vp-verifier-session' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_getOid4vpVerifierSession] [NATS call]- error in get OID4VP Verifier Session : ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async _getVerificationSessionResponse(url: string, orgId: string): Promise<any> {
    try {
      const pattern = { cmd: 'agent-get-oid4vp-verifier-session' };
      const payload = { url, orgId };
      return this.natsCall(pattern, payload);
    } catch (error) {
      this.logger.error(
        `[_getVerificationSessionResponse] [NATS call]- error in get OID4VP Verifier Session : ${JSON.stringify(error)}`
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
