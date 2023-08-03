import { IsArray, IsNotEmpty, IsNumber } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { toNumber } from '@credebl/common/cast.helper';

export class UpdateUserRolesDto {

    @ApiProperty({ example: '2' })
    @IsNotEmpty({ message: 'Please provide valid orgId' })
    @Transform(({ value }) => toNumber(value))
    @IsNumber()
    orgId: number;

    @ApiProperty({ example: '3' })
    @IsNotEmpty({ message: 'Please provide valid userId' })
    @Transform(({ value }) => toNumber(value))
    @IsNumber()
    userId: number;

    @ApiProperty({ example: [2, 1, 3] })
    @IsNotEmpty({ message: 'Please provide valid orgRoleId' })
    @IsArray()
    orgRoleId: number[];

}