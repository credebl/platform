import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class SendInvitationDto {
    email: string;
    orgRoleId: string[];
}

@ApiExtraModels()
export class BulkSendInvitationDto {
    invitations: SendInvitationDto[];
    orgId: string;
}