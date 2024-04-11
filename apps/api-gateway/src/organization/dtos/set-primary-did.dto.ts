import { ApiExtraModels, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString} from 'class-validator';

import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class PrimaryDid {

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'OrgId is required.' })
    @IsString({ message: 'Organization name must be in string format.' })
    orgId: string;

    @ApiPropertyOptional()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Did is required.' })
    @IsString({ message: 'Did must be in string format.' })
    did: string;     

    @ApiPropertyOptional()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Id is required.' })
    @IsString({ message: 'Id must be in string format.' })
    id: string; 
    
}