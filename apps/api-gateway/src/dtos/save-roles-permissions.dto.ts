import { ApiProperty } from '@nestjs/swagger';

export class RolesPermissionsObj {
  @ApiProperty()
  roleId: string;

  @ApiProperty({ type: Number })
  permissionsId: number;
}

export class SaveRolesPermissionsDto {
  @ApiProperty({ type: RolesPermissionsObj })
  data: RolesPermissionsObj;
}
