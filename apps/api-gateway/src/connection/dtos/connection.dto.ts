import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConnectionDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'alias must be a string' }) 
    @IsNotEmpty({ message: 'please provide valid alias' })
    alias: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'label must be a string' }) @IsNotEmpty({ message: 'please provide valid label' })
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
    @IsNotEmpty({ message: 'autoAcceptConnection should boolean' })
    autoAcceptConnection: boolean;

    orgId: string;
}

export class ConnectionDto {
    @ApiProperty()
    @IsOptional()
    _tags?: object;

    @ApiProperty()
    @IsOptional()
    metadata: object;
    
    @ApiProperty()
    @IsOptional()
    connectionTypes: object[];
    
    @ApiProperty()
    @IsOptional()
    id: string;

    @ApiProperty()
    @IsOptional()
    createdAt: string;

    @ApiProperty()
    @IsOptional()
    did: string;

    @ApiProperty()
    @IsOptional()
    theirDid: string;

    @ApiProperty()
    @IsOptional()
    theirLabel: string;
    
    @ApiProperty()
    @IsOptional()
    state: string;

    @ApiProperty()
    @IsOptional()
    role: string;

    @ApiProperty()
    @IsOptional()
    autoAcceptConnection: boolean;
    
    @ApiProperty()
    @IsOptional()
    threadId: string;

    @ApiProperty()
    @IsOptional()
    protocol: string;
    
    @ApiProperty()
    @IsOptional()
    outOfBandId: string;

    @ApiProperty()
    @IsOptional()
    updatedAt: string;   

    @ApiProperty()
    @IsOptional()
    contextCorrelationId: string;
}