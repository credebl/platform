import { IsArray, IsNotEmpty} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolesDto {

    orgId: string;
    userId: string;

    @ApiProperty({
        example: ['1']
    })
    @IsArray()
    @IsNotEmpty({ message: 'orgRoleId is required' })
    orgRoleId: string[];

    }