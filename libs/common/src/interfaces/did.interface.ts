export interface IDidCreate {
    keyType: string;
    seed?: string;
    domain?: string;
    network?: string;
    privatekey?: string;
    endpoint?: string;
    method: string;
    did?: string;
    role?: string;
    endorserDid?: string;
    didDocument?: object;
}