import { ApiProperty } from '@nestjs/swagger';

export class RolesPermissionsObj {
    @ApiProperty()
    roleId: number;

    @ApiProperty({ type: [] })
    permissionsId: number;
}

export class SaveRolesPermissionsDto {
    @ApiProperty({ type: [] })
    data: RolesPermissionsObj;
}
