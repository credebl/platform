import { ApiExtraModels, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString} from 'class-validator';

import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class PrimaryDid {
    
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