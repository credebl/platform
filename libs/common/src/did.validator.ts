import { DidMethod, KeyType } from "@credebl/enum/enum";
import { IDidCreate } from "./interfaces/did.interface";

export function validateDid(createDid: IDidCreate): string[] {
    const errors: string[] = [];

    if (DidMethod.WEB && !createDid.domain) {
        errors.push('domain is required for Web method'); 
    } else if (DidMethod.INDY && !createDid.network) {
        errors.push('network is required for Indy method'); 
    } else if (DidMethod.INDY && createDid.keyType !== KeyType.Ed25519) {
        errors.push('Only ed25519 key type is supported for Indy method'); 
    } else if ((createDid.method === DidMethod.WEB || createDid.method === DidMethod.KEY) && 
    (createDid.keyType !== KeyType.Ed25519 && createDid.keyType !== KeyType.Bls12381g2)) {
        errors.push('Only ed25519 and bls12381g2 key type is supported');
    } else if (!createDid.role) {
        errors.push('role or endorserDid is required');
    }

    return errors;
}
