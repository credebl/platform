import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MaxLength, IsString, MinLength, Matches, IsOptional } from 'class-validator';
import { CreateDidDto } from './create-did.dto';
const labelRegex = /^[a-zA-Z0-9 ]*$/;
export class CreateTenantDto extends CreateDidDto {
    @ApiProperty()
    @MaxLength(25, { message: 'Maximum length for label must be 25 characters.' })
    @IsString({ message: 'label must be in string format.' })
    @Transform(({ value }) => trim(value))
    @MinLength(2, { message: 'Minimum length for label must be 2 characters.' })
    @Matches(labelRegex, { message: 'Label must not contain special characters.' })
    @Matches(/^\S*$/, {
        message: 'Spaces are not allowed in label'
    })
    label: string;

    @ApiProperty({ example: 'ojIckSD2jqNzOqIrAGzL' })
    @IsOptional()
    @ApiPropertyOptional()
    @IsString({ message: 'did must be in string format.' })
    clientSocketId?: string;

    orgId: string;
    
}