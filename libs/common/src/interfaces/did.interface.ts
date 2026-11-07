export interface EncryptedKeyMaterial {
  sessionId: string;
  jwe: string;
}

export interface IDidCreate {
  keyType?: string;
  seed?: string;
  domain?: string;
  network?: string;
  privatekey?: string;
  privateKey?: string;
  privateKeyJwk?: Record<string, unknown>;
  passphrase?: string;
  encryptedKey?: EncryptedKeyMaterial;
  endpoint?: string;
  method: string;
  did?: string;
  role?: string;
  endorserDid?: string;
  didDocument?: object;
}
