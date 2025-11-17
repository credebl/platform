/* eslint-disable @typescript-eslint/array-type */

import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString} from 'class-validator';
import { IsCredentialJsonLdContext, SingleOrArray } from '../../issuance/utils/helper';
import { JsonObject } from '../../issuance/interfaces';


export class SelfAttestedCredentialDto {
  @ApiProperty({
    example: [
      'https://www.w3.org/2018/credentials/v1',
      'https://dev-schema.ngotag.com/schemas/50add817-e7f1-4651-bd62-5471b2f5918f'
    ]
  })
  @IsNotEmpty({ message: 'context  is required' })
  @IsCredentialJsonLdContext()
  '@context': Array<string | JsonObject>;

  @ApiProperty({
    example: [
      'VerifiableCredential',
      'Email'
    ]
  })
  @IsNotEmpty({ message: 'type is required' })
  type: string[];

  @ApiProperty({
    example: {
      'Email': 'dorji@gmail.com'
    }
  })
  @IsNotEmpty({ message: ' credential subject required' })
  credentialSubject: SingleOrArray<JsonObject>;
  [key: string]: unknown;

  @ApiProperty({
    example: 'Ed25519Signature2018'
  })
  @IsString()
  @IsNotEmpty({ message: 'proof type is required' })
  proofType: string;

  userId: string;
  email: string;
}