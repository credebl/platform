import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

interface ITags {
    state: string;
    connectionId: string;
    threadId: string;
}

interface IndyCredential {
    schemaId: string;
    credentialDefinitionId: string;
}
interface ICredentialAttributes {
    'mime-type': string;
    name: string;
    value: string;
}

interface IMetadata {
    '_internal/indyCredential': IndyCredential;
}

export class IssueCredentialSaveDto {

    @ApiProperty()
    @IsOptional()
    _tags: ITags;

    @ApiProperty()
    @IsOptional()
    metadata: IMetadata;

    @ApiProperty()
    @IsOptional()
    credentials: [];

    @ApiProperty()
    @IsOptional()
    id: string;

    @ApiProperty()
    @IsOptional()
    createdAt: string;

    @ApiProperty()
    @IsOptional()
    state: string;

    @ApiProperty()
    @IsOptional()
    connectionId: string;

    @ApiProperty()
    @IsOptional()
    threadId: string;

    @ApiProperty()
    @IsOptional()
    protocolVersion: string;

    @ApiProperty()
    @IsOptional()
    credentialAttributes: ICredentialAttributes[];

    @ApiProperty()
    @IsOptional()
    autoAcceptCredential: string;
}