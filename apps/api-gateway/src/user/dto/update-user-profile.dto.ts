import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';


export class UpdateUserProfileDto {
    id: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({ message: 'ProfileLogoUrl should be string' })
    profileImg?: string;

    @ApiPropertyOptional({ example: 'Alen' })
    @IsString({ message: 'firstName should be string' })
    @IsOptional()
    firstName?: string;

    @ApiPropertyOptional({ example: 'Harvey' })
    @IsString({ message: 'lastName should be string' })
    @IsOptional()
    lastName?: string;

    @ApiPropertyOptional({ example: true })
    @IsBoolean({ message: 'isPublic should be boolean' })
    @IsOptional()
    isPublic?: boolean = false;
}