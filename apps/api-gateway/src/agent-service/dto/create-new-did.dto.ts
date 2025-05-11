import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';
import { CreateDidDto } from './create-did.dto';
export class CreateNewDidDto extends CreateDidDto {
    @ApiProperty({example: false})
    @ApiPropertyOptional()
    @IsBoolean({ message: 'isPrimaryDid did must be true or false.' })
    isPrimaryDid: boolean = false; 
}