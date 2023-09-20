import { IsArray, IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolesDto {


    orgId: number;
    userId: number;

    @ApiProperty({ example: [2, 1, 3] })
    @IsNotEmpty({ message: 'Please provide valid orgRoleId' })
    @IsArray()
    orgRoleId: number[];

}