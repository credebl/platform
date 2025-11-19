import { DidMethod } from '@credebl/enum/enum';
import { IDidCreate } from './interfaces/did.interface';
import { BadRequestException } from '@nestjs/common';

export function validateDid(createDid: IDidCreate): void {
    const errors = [];

    switch (true) {
        case DidMethod.WEB === createDid.method && !createDid.domain:
            errors.push('domain is required for Web method');
            break;    
        case (createDid.method === DidMethod.INDY || createDid.method === DidMethod.POLYGON) && !createDid.network:
            errors.push('network is required');
            break;
        case (createDid.method === DidMethod.INDY || createDid.method === DidMethod.POLYGON) && 'ed25519' !== createDid.keyType:
            errors.push('Only ed25519 key type is supported');
            break;
        case (createDid.method === DidMethod.WEB || createDid.method === DidMethod.KEY) && !('ed25519' === createDid.keyType || 'bls12381g2' === createDid.keyType):
            errors.push('Only ed25519 and bls12381g2 key type is supported');
            break;
        case DidMethod.INDY === createDid.method && !(createDid.role || createDid.endorserDid):
            errors.push('role or endorserDid is required');
            break;
        case DidMethod.POLYGON === createDid.method && !createDid.privatekey:
            errors.push('privatekey is required for polygon method');
            break;
        case DidMethod.POLYGON === createDid.method && createDid.privatekey && 64 !== createDid.privatekey.length:
            errors.push('Private key must be exactly 64 characters long');
            break;
        case (DidMethod.INDY === createDid.method || DidMethod.KEY === createDid.method || DidMethod.WEB === createDid.method) && (!createDid.seed):
            errors.push('seed is required');
            break;
        default:
            break;
    }

    if (0 < errors.length) {
        throw new BadRequestException(errors);
    }
}
