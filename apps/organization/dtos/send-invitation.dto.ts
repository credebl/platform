import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class SendInvitationDto {
    email: string;
    orgRoleId: number[];
}

@ApiExtraModels()
export class BulkSendInvitationDto {
    invitations: SendInvitationDto[];
    orgId: number;
}