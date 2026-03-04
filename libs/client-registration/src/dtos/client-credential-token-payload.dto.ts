export class ClientCredentialTokenPayloadDto {
  // eslint-disable-next-line camelcase
  client_id: string;
  // eslint-disable-next-line camelcase
  client_secret: string;
  audience?: string;
  // eslint-disable-next-line camelcase
  grant_type?: string = 'client_credentials';
  scope?: string;

  constructor(clientId: string, clientSecret: string) {
    // eslint-disable-next-line camelcase
    this.client_id = clientId;
    // eslint-disable-next-line camelcase
    this.client_secret = clientSecret;
  }
}
