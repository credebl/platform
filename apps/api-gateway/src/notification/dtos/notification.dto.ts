import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';

@ApiExtraModels()
export class RegisterHolderCredentalsDto {

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'fcmToken is required.' })
    @IsString({ message: 'fcmToken must be in string format.' })
    fcmToken: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'orgId is required.' })
    @IsString({ message: 'orgId must be in string format.' })
    orgId: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'userKey is required.' })
    @IsString({ message: 'userKey must be in string format.' })
    userKey: string;
}

export class RegisterOrgWebhhookEndpointDto {

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'orgId is required.' })
    @IsString({ message: 'orgId must be in string format.' })
    orgId: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'webhookEndpoint is required.' })
    @IsString({ message: 'webhookEndpoint must be in string format.' })
    webhookEndpoint: string;
}

export class SendNotificationDto {

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'fcmToken is required.' })
    @IsString({ message: 'fcmToken must be in string format.' })
    fcmToken: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: '@type is required.' })
    @IsString({ message: '@type must be in string format.' })
    '@type': string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'clientCode is required.' })
    @IsString({ message: 'clientCode must be in string format.' })
    clientCode: string;
}