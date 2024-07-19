import { IsNotEmpty, IsString } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { IsHostPortOrDomain } from '@credebl/common/cast.helper';

export class CloudBaseWalletConfigureDto {
  @ApiProperty({ example: 'xxx-xxxx-xxxx' })
  @IsString({ message: 'walletKey must be a string' })
  @IsNotEmpty({ message: 'please provide valid walletKey' })
  walletKey: string;

  @ApiProperty({ example: 'xxx-xxxx-xxxx' })
  @IsString({ message: 'apiKey must be a string' })
  @IsNotEmpty({ message: 'please provide valid apiKey' })
  apiKey: string;

  @ApiProperty({ example: '0.0.0.0' })
  @IsString({ message: 'agentEndpoint must be a string' })
  @IsNotEmpty({ message: 'please provide valid agentEndpoint' })
  @IsHostPortOrDomain({ message: 'agentEndpoint must be a valid host:port or domain' })
  agentEndpoint: string;

  userId: string;

  email: string;
}
