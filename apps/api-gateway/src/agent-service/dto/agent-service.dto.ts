import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength, IsArray } from 'class-validator';
const regex = /^[a-zA-Z0-9 ]*$/;
export class AgentSpinupDto {

    orgId: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'walletName is required' })
    @MinLength(2, { message: 'walletName must be at least 2 characters.' })
    @MaxLength(50, { message: 'walletName must be at most 50 characters.' })
    @IsString({ message: 'walletName must be in string format.' })
    @Matches(regex, { message: 'Wallet name must not contain special characters.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in wallet name'
    })
    walletName: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Password is required.' })
    walletPassword: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'seed is required' })
    @MaxLength(32, { message: 'seed must be at most 32 characters.' })
    @IsString({ message: 'seed must be in string format.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in seed'
    })
    seed: string;

    @ApiProperty()
    @IsOptional()
    @IsString({ message: 'did must be in string format.' })
    did?: string;

    @ApiProperty({ example: [1] })
    @IsOptional()
    @IsArray({ message: 'ledgerId must be an array' })
    @IsNotEmpty({ message: 'please provide valid ledgerId' })
    ledgerId?: string[];

    @ApiProperty()
    @IsOptional()
    @ApiPropertyOptional()
    clientSocketId?: string;

    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional()
    tenant?: boolean;

    @ApiProperty()
    @IsOptional()
    @ApiPropertyOptional()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'agentType is required' })
    @MinLength(2, { message: 'agentType must be at least 2 characters.' })
    @MaxLength(50, { message: 'agentType must be at most 50 characters.' })
    @IsString({ message: 'agentType must be in string format.' })
    agentType?: string;

    @ApiProperty()
    @IsOptional()
    @ApiPropertyOptional()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'transactionApproval is required' })
    @MinLength(2, { message: 'transactionApproval must be at least 2 characters.' })
    @MaxLength(50, { message: 'transactionApproval must be at most 50 characters.' })
    @IsString({ message: 'transactionApproval must be in string format.' })
    transactionApproval?: string;
}