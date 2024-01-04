import { trim } from '@credebl/common/cast.helper';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterUserDto {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attribute: any;


    @ApiProperty({ example: 'awqx@getnada.com' })
    @IsEmail({}, { message: 'Please provide a valid email' })
    @IsNotEmpty({ message: 'Email is required' })
    @IsString({ message: 'Email should be a string' })
    @Transform(({ value }) => trim(value))
    adminEmail: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid orgName'})
    @IsString({message:'OrgName should be string'})
    orgName: string;

    @ApiProperty()
    // @IsNotEmpty({message:'Please provide valid adminPassword'})
    @IsString({message:'AdminPassword should be string'})
    adminPassword?: string;

    @ApiProperty()
    @IsNotEmpty({message:'Please provide valid orgCategory'})
    // @IsInt({message:'OrgCategory should be number'})
    orgCategory: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'FirstName should be string'})
    firstName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'LastName should be string'})
    lastName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'Description should be string'})
    description: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'DisplayName should be string'})
    displayName: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'LogoUrl should be string'})
    logoUrl: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'Address should be string'})
    address: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'AdminContact should be string'})
    adminContact: string;

    @ApiPropertyOptional()
    @IsOptional()
    // @IsInt({message:'NoOfUsers should be number'})
    noOfUsers: number;

    @ApiPropertyOptional()
    @IsOptional()
    // @IsInt({message:'NoOfSchemas should be number'})
    noOfSchemas: number;

    @ApiPropertyOptional()
    @IsOptional()
    // @IsInt({message:'NoOfCredentials should be number'})
    noOfCredentials: number;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'AdminUsername should be string'})
    adminUsername: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString({message:'Keywords should be string'})
    Keywords: string;

    @IsOptional()
    @IsString({message:'ByAdmin should be string'})
    byAdmin?: string;

    @IsOptional()
    // @IsInt({message:'TenantId should be number'})
    tenantId?: string;

    @IsOptional()
    @IsString({message:'Tags should be string'})
    tags?: string;

    @IsOptional()
    // @IsInt({message:'InviteId should be number'})
    inviteId: number;

    @IsOptional()
    @IsInt({message:'OnBoardingType should be number'})
    onBoardingType?: number;

    featureId: number;
}
