import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { CreateDidDto } from './create-did.dto';
const regex = /^[a-zA-Z0-9 ]*$/;
export class AgentSpinupDto extends CreateDidDto {
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

  @ApiProperty()
  @Transform(({ value }) => trim(value))
  @IsOptional()
  @IsString({ message: 'walletPassword must be in string format.' })
  @IsNotEmpty({ message: 'Password is required.' })
  walletPassword?: string;

  @ApiPropertyOptional({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
  @IsOptional()
  @Transform(({ value }) => trim(value))
  @IsString({ message: 'did must be in string format.' })
  did?: string;

  @ApiPropertyOptional({ example: 'ojIckSD2jqNzOqIrAGzL' })
  @IsOptional()
  clientSocketId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  tenant?: boolean;

  @ApiPropertyOptional({ example: 'ACAPY' })
  @IsOptional()
  @IsString()
  agentType?: string;
  
  orgId: string;
}
