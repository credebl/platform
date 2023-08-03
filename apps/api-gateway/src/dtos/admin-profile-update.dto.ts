import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class AdminProfileDto {
    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid displayName'})
    @IsString({message:'DisplayName should be string'})
    displayName?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid description'})
    @IsString({message:'Description should be string'})
    description?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid adminContact'})
    @IsString({message:'AdminContact should be string'})
    adminContact?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid address'})
    @IsString({message:'Address should be string'})
    address?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid logoUrl'})
    @IsString({message:'LogoUrl should be string'})
    logoUrl?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid website'})
    @IsString({message:'Website should be string'})
    website?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid solutionTitle'})
    @IsString({message:'SolutionTitle should be string'})
    solutionTitle?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid solutionDesc'})
    @IsString({message:'SolutionDesc should be string'})
    solutionDesc?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid tags'})
    @IsString({message:'Tags should be string'})
    tags?: string;
}