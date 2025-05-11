import { ApiProperty } from '@nestjs/swagger';

export class ApprovalStatusDto {

    @ApiProperty()
    approvalStatus: boolean;
}
