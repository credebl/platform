import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';

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