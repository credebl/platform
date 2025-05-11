import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsNotEmptyObject, IsObject } from 'class-validator';
interface ICredAttrSpec {
    'mime-type': string,
    name: string,
    value: string
}

interface ICredentialPreview {
    '@type': string,
    attributes: ICredAttrSpec[]
}

export class IssueCredentialOfferDto {

    @ApiProperty({ example: true })
    @IsNotEmpty({message:'Please provide valid auto-issue'})
    @IsBoolean({message:'Auto-issue should be boolean'})
    auto_issue: boolean;

    @ApiProperty({ example: true })
    @IsNotEmpty({message:'Please provide valid auto-remove'})
    @IsBoolean({message:'Auto-remove should be boolean'})
    auto_remove: boolean;

    @ApiProperty({ example: 'comments' })
    @IsNotEmpty({message:'Please provide valid comment'})
    @IsString({message:'Comment should be string'})
    comment: string;

    @ApiProperty({ example: 'WgWxqztrNooG92RXvxSTWv:3:CL:20:tag' })
    @IsNotEmpty({message:'Please provide valid cred-def-id'})
    @IsString({message:'Cred-def-id should be string'})
    cred_def_id: string;

    @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
    @IsNotEmpty({message:'Please provide valid connection-id'})
    @IsString({message:'Connection-id should be string'})
    connection_id: string;

    @ApiProperty({ example: false })
    @IsNotEmpty({message:'Please provide valid trace'})
    @IsBoolean({message:'Trace should be boolean'})
    trace: boolean;


    @ApiProperty({
        example: {
            '@type': 'issue-credential/1.0/credential-preview',
            'attributes': [
                {
                    'mime-type': 'image/jpeg',
                    'name': 'favourite_drink',
                    'value': 'martini'
                }
            ]
        }
    }
    )
   
    @IsObject({message:'Credential-preview should be object'})
    credential_preview: ICredentialPreview;
}

