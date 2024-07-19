import { IsBoolean, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotSQLInjection, trim } from '@credebl/common/cast.helper';
import { Transform } from 'class-transformer';

export class CreateCloudWalletDto {
    @ApiProperty({ example: 'Credential Wallet', description: 'Cloud wallet label' })
    @IsString({ message: 'label must be a string' })
    @IsNotEmpty({ message: 'please provide valid label' })
    @Transform(({ value }) => trim(value))
    @IsNotSQLInjection({ message: 'label is required.' })
    label: string;

    @ApiProperty({ example: 'https://picsum.photos/200', description: 'Connection image URL' })
    @IsString({ message: 'Image URL must be a string' })
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid image URL' })
    @Transform(({ value }) => trim(value))
    @IsNotSQLInjection({ message: 'Image URL is required.' })
    connectionImageUrl?: string;

    email?: string;
    
    userId?: string;

}

export class ReceiveInvitationUrlDTO {
    @ApiPropertyOptional()
    @IsString({ message: 'alias must be a string' })
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid alias' })
    @Transform(({ value }) => trim(value))
    @IsNotSQLInjection({ message: 'alias is required.' })
    alias?: string;
  
    @ApiPropertyOptional()
    @IsString({ message: 'label must be a string' })
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid label' })
    @Transform(({ value }) => trim(value))
    @IsNotSQLInjection({ message: 'label is required.' })
    label?: string;
  
    @ApiPropertyOptional()
    @IsString({ message: 'Image URL must be a string' })
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid image URL' })
    @Transform(({ value }) => trim(value))
    @IsNotSQLInjection({ message: 'Image URL is required.' })
    imageUrl?: string;
  
    @ApiPropertyOptional()
    @IsBoolean({ message: 'autoAcceptConnection must be a boolean' })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    autoAcceptConnection?: boolean;
  
    @ApiPropertyOptional()
    @IsBoolean({ message: 'autoAcceptInvitation must be a boolean' })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    autoAcceptInvitation?: boolean;
  
    @ApiPropertyOptional()
    @IsBoolean({ message: 'reuseConnection must be a boolean' })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    reuseConnection?: boolean;
  
    @ApiPropertyOptional()
    @IsInt({ message: 'acceptInvitationTimeoutMs must be an integer' })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    acceptInvitationTimeoutMs?: number;
  
    @ApiPropertyOptional()
    @IsString({ message: 'ourDid must be a string' })
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid ourDid' })
    @Transform(({ value }) => trim(value))
    @IsNotSQLInjection({ message: 'ourDid is required.' })
    ourDid?: string;
  
    @ApiProperty()
    @IsString({ message: 'invitationUrl must be a string' })
    @IsNotEmpty({ message: 'please provide valid invitationUrl' })
    @Transform(({ value }) => trim(value))
    @IsNotSQLInjection({ message: 'invitationUrl is required.' })
    invitationUrl: string;

    email?: string;
    
    userId?: string;
  }

  export class AcceptOfferDto {
    @ApiPropertyOptional({ example: 'string', description: 'autoAcceptCredential' })
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'autoAcceptCredential must be a string' })
    autoAcceptCredential: string;
  
    @ApiPropertyOptional({ example: 'string', description: 'Comment' })
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'comment must be a string' })
    @IsOptional()
    comment?: string;
  
    @ApiProperty({ example: 'string', description: 'Credential record ID' })
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'credentialRecordId must be a string' })
    credentialRecordId: string;
  
    @ApiPropertyOptional({ type: Object, description: 'Credential formats' })
    @Transform(({ value }) => trim(value))
    @IsObject({ message: 'credentialFormats must be an object' })
    credentialFormats: object;

    email?: string;
    
    userId?: string;
  }

  export class CreateCloudWalletDidDto {

    @ApiProperty({ example: '000000000000000000000000000Seed2' })
    @MaxLength(32, { message: 'seed must be at most 32 characters.' })
    @Transform(({ value }) => trim(value))
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'seed must be in string format.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in seed'
    })
    seed?: string;

    @ApiProperty({ example: 'ed25519'})
    @IsNotEmpty({ message: 'key type is required' })
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'key type be in string format.' })
    keyType: string;

    @ApiProperty({ example: 'polygon'})
    @IsNotEmpty({ message: 'method is required' })
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'method must be in string format.' })
    method: string;

    @ApiPropertyOptional({example: 'indicio:testnet'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'network must be in string format.' })
    network?: string;

    @ApiPropertyOptional({example: 'www.google.com'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'domain must be in string format.' })
    domain?: string;

    @ApiPropertyOptional({example: 'endorser'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'role must be in string format.' })
    role?: string;

    @ApiPropertyOptional({example: ''})
    @IsOptional()
    @IsString({ message: 'private key must be in string format.' })
    @Transform(({ value }) => trim(value))
    privatekey?: string;

    @ApiPropertyOptional({example: 'http://localhost:4006/docs'})
    @IsOptional()
    @IsString({ message: 'endpoint must be in string format.' })
    endpoint?: string;

    @ApiPropertyOptional({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'did must be in string format.' })
    did?: string;

    @ApiPropertyOptional({example: 'did:indy:indicio:testnet:UEeW111G1tYo1nEkPwMef'})
    @IsOptional()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'endorser did must be in string format.' })
    endorserDid?: string;

    @ApiProperty({example: false})
    @ApiPropertyOptional()
    @IsBoolean({ message: 'isPrimaryDid did must be true or false.' })
    isPrimaryDid: boolean = false; 

    email?: string;
    
    userId?: string;
}