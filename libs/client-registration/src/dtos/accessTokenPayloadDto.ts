export class accessTokenPayloadDto {
    client_id: string;
    client_secret: string;
    grant_type?: string = 'refresh_token';
    refresh_token: string;
  }
  