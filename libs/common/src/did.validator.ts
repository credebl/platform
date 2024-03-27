import { DidMethod } from '@credebl/enum/enum';
import { IDidCreate } from './interfaces/did.interface';
import { BadRequestException } from '@nestjs/common';

export function validateDid(createDid: IDidCreate): void {

    if (DidMethod.WEB === createDid.method && !createDid.domain) {
        throw new BadRequestException('domain is required for Web method'); 
    } else if ((createDid.method === DidMethod.INDY || createDid.method === DidMethod.POLYGON) && !createDid.network) {
        throw new BadRequestException('network is required'); 
    } else if ((createDid.method === DidMethod.INDY || createDid.method === DidMethod.POLYGON) && 'ed25519' !== createDid.keyType) {
        throw new BadRequestException('Only ed25519 key type is supported'); 
    } else if ((createDid.method === DidMethod.WEB || createDid.method === DidMethod.KEY) &&  ('ed25519' !== createDid.keyType && 'bls12381g2' !== createDid.keyType)) {
        throw new BadRequestException('Only ed25519 and bls12381g2 key type is supported');
    } else if (DidMethod.INDY === createDid.method && (!createDid.role && !createDid.endorserDid)) {
        throw new BadRequestException('role or endorserDid is required');
    } else if (DidMethod.POLYGON === createDid.method && !createDid.privatekey) {
        throw new BadRequestException('privatekey is required for polygon method');
    } else if (DidMethod.POLYGON === createDid.method && !createDid.endpoint) {
        throw new BadRequestException('endpoint is required for polygon method');
    } else if ((DidMethod.INDY === createDid.method || DidMethod.KEY === createDid.method || DidMethod.WEB === createDid.method) && (!createDid.seed)) {
        throw new BadRequestException('seed is required');
    }
}