import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, ArrayUnique, IsArray, IsString, IsUUID } from 'class-validator';

export class AddOrganizationsDto {
    @ApiProperty({
        example: ['32f54163-7166-48f1-93d8-ff217bdb0653']
    })
    @ArrayNotEmpty({ message: 'Organization Ids array must not be empty' })
    @ArrayUnique({ message: 'Duplicate Organization Ids are not allowed' })
    @IsArray()
    @IsUUID('4', { each: true, message: 'Invalid format of organization Id' })
    @IsString({ each: true, message: 'Each organization Id in the array should be a string' })
    organizationIds: string[];   
    
    ecosystemId: string;

    orgId: string;
}
