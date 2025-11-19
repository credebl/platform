import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { IsHostPortOrDomain } from '@credebl/common/cast.helper';
// import { Transform } from 'class-transformer';

export class CloudBaseWalletConfigureDto {
  @ApiProperty({ example: 'xxx-xxxx-xxxx' })
  @IsString({ message: 'walletKey must be a string' })
  @IsNotEmpty({ message: 'please provide valid walletKey' })
  walletKey: string;

  @ApiProperty({ example: 'xxx-xxxx-xxxx' })
  @IsString({ message: 'apiKey must be a string' })
  @IsNotEmpty({ message: 'please provide valid apiKey' })
  apiKey: string;

  @ApiProperty({ example: 'http://0.0.0.0:4001' })
  @IsString({ message: 'agentEndpoint must be a string' })
  @IsNotEmpty({ message: 'please provide valid agentEndpoint' })
  @IsHostPortOrDomain({ message: 'Agent Endpoint must be a valid protocol://host:port or domain'})
  agentEndpoint: string;

  @ApiProperty({
    example: 5,
    description: 'Maximum number of sub wallets allowed'
  })
  @IsInt()
  @Min(1)
  maxSubWallets: number;

  // @ApiProperty({ example: '5edee49e-17f1-4b54-9070-ef00789777d4' })
  // @IsString({ message: 'orgId must be a string' })
  // @IsNotEmpty({ message: 'please provide valid orgId' })
  // orgId: string;
  
  // @ApiProperty()
  // @Transform(({ value }) => trim(value))
  // @IsNotEmpty({ message: 'webhookUrl is required.' })
  // @IsString({ message: 'webhookUrl must be in string format.' })
  // @IsUrl(undefined, {message:'webhookUrl is not valid'})
  // webhookUrl: string;

  userId: string;

  email: string;
}
