export interface IOidcHolderResolveCredentialOffer {
  credentialOfferUri: string;
}

export interface IOidcHolderRequestCredential {
  credentialOfferUri: string;
  credentialsToRequest: string[];
  txCode?: string;
}

export interface IOidcHolderResolveProofRequest {
  proofRequestUri: string;
}

export interface IOidcHolderAcceptProofRequest {
  proofRequestUri: string;
}
