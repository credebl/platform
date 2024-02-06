import { ArrayNotEmpty, IsArray, IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl, ValidateNested } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateConnectionDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'alias must be a string' })
    @IsNotEmpty({ message: 'please provide valid alias' })
    alias: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'label must be a string' })
    @IsNotEmpty({ message: 'please provide valid label' })
    label: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid imageUrl' })
    @IsUrl({}, { message: 'Invalid imageUrl format' })
    imageUrl: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @IsNotEmpty({ message: 'please provide multiUseInvitation' })
    multiUseInvitation: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide autoAcceptConnection' })
    autoAcceptConnection: boolean;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide goalCode' })
    goalCode: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide goal' })
    goal: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @IsNotEmpty({ message: 'Please provide handshake' })
    handshake: boolean;

    @ApiPropertyOptional()
    @IsArray()
    @ArrayNotEmpty()
    @IsOptional()
    @IsString({ each: true })
    handshakeProtocols: string[];

    orgId: string;
}

export class ConnectionDto {
    @ApiPropertyOptional()
    @IsOptional()
    id: string;

    @ApiPropertyOptional()
    @IsOptional()
    createdAt: string;

    @ApiPropertyOptional()
    @IsOptional()
    did: string;

    @ApiPropertyOptional()
    @IsOptional()
    theirDid: string;

    @ApiPropertyOptional()
    @IsOptional()
    theirLabel: string;

    @ApiPropertyOptional()
    @IsOptional()
    state: string;

    @ApiPropertyOptional()
    @IsOptional()
    role: string;

    @ApiPropertyOptional()
    @IsOptional()
    imageUrl: string;

    @ApiPropertyOptional()
    @IsOptional()
    autoAcceptConnection: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    threadId: string;

    @ApiPropertyOptional()
    @IsOptional()
    protocol: string;

    @ApiPropertyOptional()
    @IsOptional()
    outOfBandId: string;

    @ApiPropertyOptional()
    @IsOptional()
    updatedAt: string;

    @ApiPropertyOptional()
    @IsOptional()
    contextCorrelationId: string;

    @ApiPropertyOptional()
    @IsOptional()
    type: string;
}

class ReceiveInvitationCommonDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'alias must be a string' })
    @IsNotEmpty({ message: 'please provide valid alias' })
    alias: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'label must be a string' })
    @IsNotEmpty({ message: 'please provide valid label' })
    label: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'imageUrl must be a string' })
    @IsNotEmpty({ message: 'please provide valid imageUrl' })
    @IsUrl({}, { message: 'Invalid imageUrl format' })
    imageUrl: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean({ message: 'autoAcceptConnection must be a boolean' })
    @IsNotEmpty({ message: 'please provide valid autoAcceptConnection' })
    autoAcceptConnection: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean({ message: 'autoAcceptInvitation must be a boolean' })
    @IsNotEmpty({ message: 'please provide valid autoAcceptInvitation' })
    autoAcceptInvitation: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean({ message: 'reuseConnection must be a boolean' })
    @IsNotEmpty({ message: 'please provide valid reuseConnection' })
    reuseConnection: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsNumber()
    @IsNotEmpty({ message: 'please provide valid acceptInvitationTimeoutMs' })
    acceptInvitationTimeoutMs: number;
}

export class ReceiveInvitationUrlDto extends ReceiveInvitationCommonDto {

    @ApiProperty()
    @IsOptional()
    @IsString({ message: 'invitationUrl must be a string' })
    @IsNotEmpty({ message: 'please provide valid invitationUrl' })
    @IsUrl({}, { message: 'Invalid imageUrl format' })
    invitationUrl: string;
}


class ServiceDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'please provide valid id' })
    id: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'please provide valid serviceEndpoint' })
    @IsUrl({}, { message: 'Invalid serviceEndpoint format' })
    serviceEndpoint: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'please provide valid type' })
    type: string;

    @ApiProperty()
    @IsString({ each: true })
    recipientKeys: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ each: true })
    routingKeys: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ each: true })
    accept: string[];
}

class InvitationDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'please provide valid @id' })
    '@id': string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'please provide valid @type' })
    '@type': string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty({ message: 'please provide valid label' })
    label: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'please provide valid goalCode' })
    goalCode: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'please provide valid goal' })
    goal: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ each: true })
    accept: string[];

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ each: true })
    // eslint-disable-next-line camelcase
    handshake_protocols: string[];

    @ApiProperty()
    @ValidateNested({ each: true })
    @Type(() => ServiceDto)
    services: ServiceDto[];

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid imageUrl' })
    @IsUrl({}, { message: 'Invalid imageUrl format' })
    imageUrl?: string;
}

export class ReceiveInvitationDto extends ReceiveInvitationCommonDto {

    @ApiProperty()
    @ValidateNested()
    @Type(() => InvitationDto)
    invitation: InvitationDto;
}