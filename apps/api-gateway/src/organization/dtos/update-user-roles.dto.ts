import { IsArray, IsNotEmpty} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolesDto {

    orgId: string;
    userId: string;

    @ApiProperty({
        example: [2, 1, 3]
    })
    @IsArray()
    @IsNotEmpty({ message: 'orgRoleId is required' })
    orgRoleId: string[];

    }