import {  IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class UpdateNonAdminUserDto {
    @ApiProperty()
    @IsNotEmpty({ message: 'Please provide valid organization id.' })
    @IsInt({ message: 'Organization id should be number.' })
    id: number;

    @ApiProperty()
    @IsNotEmpty({ message: 'Please provide valid status.' })
    @IsBoolean({ message: 'Status should be boolean.' })
    isActive: boolean;
}
