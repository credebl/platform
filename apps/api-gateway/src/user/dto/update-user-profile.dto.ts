import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString} from 'class-validator';


export class UpdateUserProfileDto {
    id: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'ProfileLogoUrl should be string'})
    profileImg?: string;

    @ApiProperty({ example: 'Alen' })
    @IsString({ message: 'firstName should be string' })
    @IsOptional()
    firstName?: string;

    @ApiProperty({ example: 'Harvey' })
    @IsString({ message: 'lastName should be string' })
    @IsOptional()
    lastName?: string;
}