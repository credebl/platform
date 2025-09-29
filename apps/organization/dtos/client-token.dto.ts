export class ClientTokenDto {
  orgId: string;
  clientAlias: string;
  clientId: string;
  clientSecret: string;
  grantType?: string = 'client_credentials';
}
