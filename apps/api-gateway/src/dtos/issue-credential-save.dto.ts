import { ApiPropertyOptional } from '@nestjs/swagger';
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

    @ApiPropertyOptional()
    @IsOptional()
    _tags: ITags;

    @ApiPropertyOptional()
    @IsOptional()
    metadata: IMetadata;

    @ApiPropertyOptional()
    @IsOptional()
    credentials: [];

    @ApiPropertyOptional()
    @IsOptional()
    id: string;

    @ApiPropertyOptional()
    @IsOptional()
    createdAt: string;

    @ApiPropertyOptional()
    @IsOptional()
    state: string;

    @ApiPropertyOptional()
    @IsOptional()
    connectionId: string;

    @ApiPropertyOptional()
    @IsOptional()
    threadId: string;

    @ApiPropertyOptional()
    @IsOptional()
    protocolVersion: string;

    @ApiPropertyOptional()
    @IsOptional()
    credentialAttributes: ICredentialAttributes[];

    @ApiPropertyOptional()
    @IsOptional()
    autoAcceptCredential: string;
}