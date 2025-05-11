import { ArrayNotEmpty, IsArray, IsNotEmpty, IsUUID, MinLength} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolesDto {

    orgId: string;
    userId: string;

    @ApiProperty({
        example: ['2', '1', '3']
    })
    
    @IsArray()
    @ArrayNotEmpty()
    @MinLength(0, {each: true})
    @IsNotEmpty({each: true})
    @IsUUID('4', { each: true, message: 'Invalid format of orgRoleId' })
    orgRoleId: string[];
}