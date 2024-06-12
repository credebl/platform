import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString, IsUUID } from 'class-validator';

export class AddOrganizationsDto {
    @ApiProperty({
        example: ['32f54163-7166-48f1-93d8-ff217bdb0653']
    })
    @IsArray()
    @ArrayNotEmpty({ message: 'Organization Ids array must not be empty' })
    @IsUUID('4', { each: true })
    @ArrayUnique({ message: 'Duplicate Organization Ids are not allowed' })
    @IsString({ each: true, message: 'Each organization Id in the array should be a string' })
    @Transform(({ value }) => value.map((item: string) => item.trim()))
    organizationIds: string[];   
    
    ecosystemId: string;

    orgId: string;
}
