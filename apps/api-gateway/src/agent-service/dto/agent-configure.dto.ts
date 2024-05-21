import { trim } from '@credebl/common/cast.helper';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
const regex = /^[a-zA-Z0-9 ]*$/;
export class AgentConfigureDto {
  @ApiProperty()
  @MaxLength(25, { message: 'Maximum length for wallet must be 25 characters.' })
  @IsString({ message: 'label must be in string format.' })
  @Transform(({ value }) => trim(value))
  @MinLength(2, { message: 'Minimum length for wallet name must be 2 characters.' })
  @Matches(regex, { message: 'Wallet name must not contain special characters.' })
  @Matches(/^\S*$/, {
    message: 'Spaces are not allowed in walletName'
  })
  walletName: string;

  @ApiProperty({ example: 'https://example.com' })
  @IsString()
  @IsNotEmpty()
  agentEndpoint: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  apiKey: string;

  orgId: string;
}
