import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

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
    imageUrl: string;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @IsNotEmpty({ message: 'please provide multiUseInvitation' })
    multiUseInvitation: boolean;

    @ApiPropertyOptional()
    @IsBoolean()
    @IsOptional()
    @IsNotEmpty({ message: 'autoAcceptConnection should be boolean' })
    autoAcceptConnection: boolean;

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
    invitationUrl: string;
}


class ServiceDto {
    @IsString()
    id: string;

    @IsString()
    serviceEndpoint: string;

    @IsString()
    type: string;

    @IsString({ each: true })
    recipientKeys: string[];

    @IsString({ each: true })
    routingKeys: string[];

    @IsOptional()
    @IsString({ each: true })
    accept: string[];
}

class InvitationDto {
    @IsString()
    '@id': string;

    @IsString()
    '@type': string;

    @IsString()
    label: string;

    @IsOptional()
    @IsString()
    goalCode: string;

    @IsOptional()
    @IsString()
    goal: string;

    @IsOptional()
    @IsString({ each: true })
    accept: string[];

    @IsOptional()
    @IsString({ each: true })
    // eslint-disable-next-line camelcase
    handshake_protocols: string[];

    @ValidateNested({ each: true })
    @Type(() => ServiceDto)
    services: ServiceDto[];

    @IsString()
    @IsOptional()
    imageUrl?: string;
}

export class ReceiveInvitationDto extends ReceiveInvitationCommonDto {

    @ApiProperty()
    @ValidateNested()
    @Type(() => InvitationDto)
    invitation: InvitationDto;
}