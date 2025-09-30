import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ClientTokenDto {
  @ApiProperty()
  @IsString({ message: 'orgId must be in string format.' })
  orgId: string;

  @ApiProperty()
  @IsString({ message: 'clientAlias must be in string format.' })
  clientAlias: string;

  @ApiProperty()
  @IsString({ message: 'clientId must be in string format.' })
  clientId: string;

  @ApiProperty()
  @IsString({ message: 'clientSecret must be in string format.' })
  clientSecret: string;

  @ApiProperty()
  @IsString({ message: 'grantType must be in string format.' })
  grantType?: string = 'client_credentials';
}
