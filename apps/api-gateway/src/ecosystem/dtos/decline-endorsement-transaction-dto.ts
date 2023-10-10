import { IsEnum, IsNotEmpty } from 'class-validator';

import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { trim } from '@credebl/common/cast.helper';
import { endorsementTransactionStatus } from 'apps/ecosystem/enums/ecosystem.enum';

export class DeclienEndorsementTransactionDto {
    ecosystemId: string;
    orgId: string;
    endorsementId: string;

    @ApiProperty({
        enum: [endorsementTransactionStatus.DECLINED]
    })
    @Transform(({ value }) => trim(value))
    @IsNotEmpty({ message: 'Please provide only DECLINED status' })
    @IsEnum(endorsementTransactionStatus)
    status:endorsementTransactionStatus.DECLINED;

}