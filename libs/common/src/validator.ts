import { DidMethod } from '../../enum/src/enum';
import { IDidCreate } from './interfaces/did.interface';
import { BadRequestException } from '@nestjs/common';
import { ResponseMessages } from './response-messages';
import { IProofRequestAttribute } from './interfaces/verification.interface';

export class Validator {
  static validateDid(createDid: IDidCreate): void {
    const errors = [];

    switch (true) {
      case DidMethod.WEB === createDid.method && !createDid.domain:
        errors.push(ResponseMessages.agent.error.requiredDomain);
        break;
      case (createDid.method === DidMethod.INDY || createDid.method === DidMethod.POLYGON) && !createDid.network:
        errors.push(ResponseMessages.agent.error.requiredNetwork);
        break;
      case (createDid.method === DidMethod.INDY || createDid.method === DidMethod.POLYGON) &&
        'ed25519' !== createDid.keyType:
        errors.push(ResponseMessages.agent.error.keyType);
        break;
      case (createDid.method === DidMethod.WEB || createDid.method === DidMethod.KEY) &&
        !('ed25519' === createDid.keyType || 'bls12381g2' === createDid.keyType):
        errors.push(ResponseMessages.agent.error.keyTypeWeb);
        break;
      case DidMethod.INDY === createDid.method && !(createDid.role || createDid.endorserDid):
        errors.push(ResponseMessages.agent.error.requiredEndorserDid);
        break;
      case DidMethod.POLYGON === createDid.method && !createDid.privatekey:
        errors.push(ResponseMessages.agent.error.requiredPrivateKey);
        break;
      case DidMethod.POLYGON === createDid.method && createDid.privatekey && 64 !== createDid.privatekey.length:
        errors.push(ResponseMessages.agent.error.privateKeyLength);
        break;
      case (DidMethod.INDY === createDid.method ||
        DidMethod.KEY === createDid.method ||
        DidMethod.WEB === createDid.method) &&
        !createDid.seed:
        errors.push(ResponseMessages.agent.error.requiredSeed);
        break;
      default:
        break;
    }

    if (0 < errors.length) {
      throw new BadRequestException(errors);
    }
  }

  static validateIndyProofAttributes(attributes: IProofRequestAttribute[]): void {
    const seenAttributes = new Map();

    for (const attribute of attributes) {
      const key =
        attribute.schemaId || attribute.credDefId
          ? `${attribute.schemaId || ''}:${attribute.credDefId || ''}`
          : 'default';

      if (!seenAttributes.has(key)) {
        seenAttributes.set(key, new Set());
      }

      const attributeNames = seenAttributes.get(key);
      if (attributeNames.has(attribute.attributeName)) {
        throw new BadRequestException(ResponseMessages.verification.error.uniqueAttributes);
      }
      attributeNames.add(attribute.attributeName);
    }
  }
}
