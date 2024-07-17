import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotSQLInjection } from '@credebl/common/cast.helper';

export class CreateCloudWalletDto {
    @ApiPropertyOptional()
    @IsString({ message: 'label must be a string' })
    @IsNotEmpty({ message: 'please provide valid label' })
    @IsNotSQLInjection({ message: 'label is required.' })
    label: string;

    @ApiPropertyOptional()
    @IsString({ message: 'Image URL must be a string' })
    @IsOptional()
    @IsNotEmpty({ message: 'please provide valid image URL' })
    @IsNotSQLInjection({ message: 'Image URL is required.' })
    connectionImageUrl?: string;

}
