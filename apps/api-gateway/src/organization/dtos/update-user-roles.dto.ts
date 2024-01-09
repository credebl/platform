import { IsArray, IsNotEmpty} from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRolesDto {

    orgId: string;
    userId: string;

    @ApiProperty({
        example: ['11a698ac-ab22-4312-bffe-4a799d5a67c9']
    })
    @IsArray()
    @IsNotEmpty({ message: 'orgRoleId is required' })
    orgRoleId: string[];

    }