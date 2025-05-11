import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailTokenDto {
    @ApiProperty()
    email: string;
    @ApiProperty()
    verificationCode: string;
}