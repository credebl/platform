export class ClientTokenDto {
  orgId: string;
  clientId: string;
  clientSecret: string;
  grantType?: string = 'client_credentials';
}
