import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class OrgNameCheckDto {
    @ApiProperty({example:'Organization name'})
    @IsNotEmpty({message:'Please provide valid organization Name'})
    @IsString({message:'Organization Name should be string'})
    orgName: string;

    @IsOptional()
    @ApiPropertyOptional({example:'1'})
    @IsNotEmpty({message:'Please provide valid id of organization'})
    // @IsNumberString({message:'Organization id should be number'})
    orgId?: string;

}