export class userTokenPayloadDto {
    client_id: string;
    client_secret: string;
    username: string;
    password: string;
    grant_type?: string = 'password';
   
  }
  