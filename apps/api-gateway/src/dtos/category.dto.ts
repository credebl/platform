import { IsBoolean, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
    @ApiProperty()
    @IsString({ message: 'name must be a string' })
    @IsNotEmpty({ message: 'please provide valid name' })
    name: string;

    @ApiProperty()
    @IsString({ message: 'description must be a string' })
    @MaxLength(150)
    @MinLength(2)
    @IsNotEmpty({ message: 'please provide valid description' })
    description: string;

    @ApiProperty()
    @IsNotEmpty({ message: 'Please provide a isActive' })
    @IsBoolean({ message: 'isActive id should be boolean' })
    isActive: boolean;
}
