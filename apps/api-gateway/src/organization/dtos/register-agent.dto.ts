import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
export class RegisterAgentDto {

    @ApiProperty()
    @IsOptional()
    @IsArray({ message: 'ledgerId must be an array' })
    @IsNotEmpty({ message: 'please provide valid ledgerId' })
    ledgerId?: string[];

    orgId: string;

    userId?: string;

    @ApiProperty()
    @IsString({ message: 'did must be in string format.' })
    @IsNotEmpty({ message: 'did is required' })
    did: string;

    @ApiProperty()
    @IsString({ message: 'agentEndpoint must be in string format.' })
    @IsNotEmpty({ message: 'agentEndpoint is required' })
    agentEndpoint: string;

    @ApiProperty()
    @IsString({ message: 'token must be in string format.' })
    @IsNotEmpty({ message: 'token is required' })
    token: string;
}