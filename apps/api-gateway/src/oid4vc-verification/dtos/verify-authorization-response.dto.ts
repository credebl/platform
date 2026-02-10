import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class VerifyAuthorizationResponseDto {
  @ApiProperty({
    description: 'verification session id received in the authorization response',
    example: '93e156ca-a6b9-46ea-913d-f499be167d02'
  })
  @IsString()
  @IsNotEmpty()
  verificationSessionId!: string;

  @ApiProperty({
    description:
      'authorization response received from the wallet after user approves or denies the verification request',
    example: {
      // eslint-disable-next-line camelcase
      id_token: {
        Passport: [
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tL2F1dGgvdjEvcmVhbG0tY3JlZGVibCIsInN1YiI6IjEyMzQ1Njc4OTAiLCJhdWQiOiJhdXRoLWNlbnRlci1pZCIsImV4cCI6MTY5ODAwMDAwMCwiaWF0IjoxNjk3OTk2NDAwfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
        ]
      }
    }
  })
  @IsObject()
  @IsNotEmpty()
  authorizationResponse!: Record<string, unknown>;

  @ApiProperty({
    description: 'The origin of the verification session, if Digital Credentials API was used.',
    example: 'https://example.com'
  })
  @IsString()
  origin?: string;
}
