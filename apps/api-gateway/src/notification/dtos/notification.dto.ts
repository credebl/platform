import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

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
    @IsNotEmpty({ message: 'notificationWebhook is required.' })
    @IsString({ message: 'notificationWebhook must be in string format.' })
    @IsUrl({
        // eslint-disable-next-line camelcase
        require_protocol: true, // require URL protocol (e.g., http:// or https://)
        // eslint-disable-next-line camelcase
        require_tld: true // require top-level domain (e.g., .com, .net)
        
    })
    notificationWebhook: string;
}

export class SendNotificationDto {

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'fcmToken is required.' })
    @IsString({ message: 'fcmToken must be in string format.' })
    fcmToken: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'messageType is required.' })
    @IsString({ message: 'messageType must be in string format.' })
    messageType: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'clientCode is required.' })
    @IsString({ message: 'clientCode must be in string format.' })
    clientCode: string;
}

export class GetNotificationDto {

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'fcmToken is required.' })
    @IsString({ message: 'fcmToken must be in string format.' })
    fcmToken: string;

    @ApiProperty()
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'messageType is required.' })
    @IsString({ message: 'messageType must be in string format.' })
    messageType: string;
}