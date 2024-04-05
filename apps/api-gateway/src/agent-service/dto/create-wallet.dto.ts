import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MaxLength, IsString, MinLength, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateWalletDto {
    @ApiProperty()
    @MaxLength(25, { message: 'Maximum length for label must be 25 characters.' })
    @IsString({ message: 'label must be in string format.' })
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'label is required' })
    @MinLength(2, { message: 'Minimum length for label must be 2 characters.' })
    label: string;

    @ApiProperty({ example: 'XzFjo1RTZ2h9UVFCnPUyaQ' })
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'did must be in string format.' })
    did?: string;

    @ApiProperty({ example: 'ojIckSD2jqNzOqIrAGzL' })
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'did must be in string format.' })
    clientSocketId?: string;

    orgId: string;
}