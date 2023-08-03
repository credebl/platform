import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, IsNotEmpty, IsObject } from 'class-validator';

interface IssueCredAttrSpec {
    'mime-type': string,
    name: string,
    value: string
}

interface IssueCredPreview {
    '@type': string,
    attributes: IssueCredAttrSpec[]
}


export class IssueCredentialOutOfBandDto {

    @ApiProperty({ example: 'WgWxqztrNooG92RXvxSTWv:3:CL:20:tag' })
    cred_def_id: string;

    @ApiProperty({example: {
        '@type': 'issue-credential/1.0/credential-preview',
        'attributes': [
          {
            'mime-type': 'image/jpeg',
            'name': '',
            'value': 'i'
          }
        ]
      }
    })
    @IsObject({message:'credential_proposal must be a object'})
    @IsNotEmpty({message:'please provide valid credential_proposal'})
    credential_proposal: IssueCredPreview;

    @ApiProperty({example: 'WgWxqztrNooG92RXvxSTWv'})
    @IsString({message:'issuer_did must be a string'})
    @IsNotEmpty({message:'please provide valid issuer_did'})
    issuer_did: string;

    @ApiProperty({example:'WgWxqztrNooG92RXvxSTWv:2:schema_name:1.0'})
    @IsString({message:'schema_id must be a string'})
    @IsNotEmpty({message:'please provide valid schema_id'})
    schema_id: string;

    @ApiProperty({example:'WgWxqztrNooG92RXvxSTWv'})
    @IsString({message:'schema_iisuer_did name must be a string'})
    @IsNotEmpty({message:'please provide valid schema_issuer_did'})
    schema_issuer_did:string;

    @ApiProperty({example:'preferences'})
    @IsString({message:'schema name must be a string'})
    @IsNotEmpty({message:'please provide valid schema_name'})
    schema_name: string;

    @ApiProperty({example:'1.0'})
    @IsString({message:'schema version must be a string'}) 
    @IsNotEmpty({message:'please provide valid schema_version'})
    schema_version: string;

}