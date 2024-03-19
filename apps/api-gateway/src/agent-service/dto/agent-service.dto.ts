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
        message: 'Spaces are not allowed in label'
    })
    walletName: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsString({ message: 'walletPassword must be in string format.' })
    @IsNotEmpty({ message: 'Password is required.' })
    walletPassword: string;

    @ApiProperty({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'did must be in string format.' })
    did?: string;

    @ApiProperty({ example: 'ojIckSD2jqNzOqIrAGzL' })
    @IsOptional()
    @ApiPropertyOptional()
    clientSocketId?: string;

    @ApiProperty({ example: true })
    @IsOptional()
    @IsBoolean()
    @ApiPropertyOptional()
    tenant?: boolean;

    orgId: string;
}
