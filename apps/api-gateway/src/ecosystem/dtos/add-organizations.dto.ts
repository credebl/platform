import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';

export class AddOrganizationsDto {
    @ApiProperty()
    @ArrayNotEmpty({ message: 'Organization Ids array must not be empty' })
    @ArrayUnique({ message: 'Duplicate Organization Ids are not allowed' })
    @ArrayMaxSize(Number(process.env.OOB_BATCH_SIZE), { message: `Limit reached (${process.env.OOB_BATCH_SIZE} organizations max).` })
    @IsArray()
    @IsString({ each: true, message: 'Each organization Id in the array should be a string' })
    organizationIds: string[];   
    
    ecosystemId: string;

    orgId: string;
}

