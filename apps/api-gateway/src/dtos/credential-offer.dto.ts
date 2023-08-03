import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

interface attributeValue {
    name: string,
    value: string,
}

export class IssueCredentialOffer {

    @ApiProperty({ example: { 'protocolVersion': 'v1' } })
    @IsNotEmpty({ message: 'Please provide valid protocol-version' })
    @IsString({ message: 'protocol-version should be string' })
    protocolVersion: string;
    
    @ApiProperty({ example: { 'attributes': [{ 'value': 'string', 'name': 'string' }] } })
    @IsNotEmpty({ message: 'Please provide valid attributes' })
    @IsArray({ message: 'attributes should be array' })
    attributes: attributeValue[];

    @ApiProperty({ example: { 'credentialDefinitionId': 'string' } })
    @IsNotEmpty({ message: 'Please provide valid credentialDefinitionId' })
    @IsString({ message: 'credentialDefinitionId should be string' })
    credentialDefinitionId: string;

    @ApiProperty({ example: { autoAcceptCredential: 'always' } })
    @IsNotEmpty({ message: 'Please provide valid autoAcceptCredential' })
    @IsString({ message: 'autoAcceptCredential should be string' })
    autoAcceptCredential: string;

    @ApiProperty({ example: { comment: 'string' } })
    @IsNotEmpty({ message: 'Please provide valid comment' })
    @IsString({ message: 'comment should be string' })
    comment: string;

    @ApiProperty({ example: { connectionId: '3fa85f64-5717-4562-b3fc-2c963f66afa6' } })
    @IsNotEmpty({ message: 'Please provide valid connection-id' })
    @IsString({ message: 'Connection-id should be string' })
    connectionId: string;
}
