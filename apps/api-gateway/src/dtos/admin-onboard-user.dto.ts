import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt } from 'class-validator';
export class AdminOnBoardUserDto {
    @ApiProperty()
   // @IsNotEmpty({message:'Please provide valid orgName'})
    @IsString({message:'OrgName should be string'})
    orgName: string;

    @ApiProperty()
   // @IsNotEmpty({message:'Please provide valid description'})
    @IsString({message:'Description should be string'})
    description: string;

    @ApiProperty()
    // @IsNotEmpty({message:'Please provide valid displayName'})
     @IsString({message:'DisplayName should be string'})
    displayName: string;

    @ApiProperty()
     // @IsNotEmpty({message:'Please provide valid logoUrl'})
      @IsString({message:'LogoUrl should be string'})
    logoUrl: string;

    @ApiProperty()
    // @IsNotEmpty({message:'Please provide valid address'})
     @IsString({message:'Address should be string'})
    address: string;

    @ApiProperty()
   // @IsNotEmpty({message:'Please provide valid adminEmail'})
    @IsString({message:'AdminEmail should be string'})
    adminEmail: string;

    @ApiProperty()
   // @IsNotEmpty({message:'Please provide valid adminContact'})
    @IsString({message:'AdminContact should be string'})
    adminContact: string;

    @ApiProperty()
   // @IsNotEmpty({message:'Please provide valid noOfUsers'})
    @IsInt({message:'NoOfUsers should be number'})
    noOfUsers: number;

    @ApiProperty()
    @IsInt({message:'NoOfSchemas should be number'})
    noOfSchemas: number;

    @ApiProperty()
    @IsInt({message:'NoOfCredentials should be number'})
    noOfCredentials: number;

    @ApiProperty()
    @IsString({message:'AdminPassword should be string'})
    adminPassword: string;

    @ApiProperty()
    @IsString({message:'AdminUsername should be string'})
    adminUsername: string;

    @ApiProperty()
    @IsInt({message:'OrgCategory should be number'})
    orgCategory: number;

    @IsString({message:'ByAdmin should be string'})
    byAdmin?: string;

}
