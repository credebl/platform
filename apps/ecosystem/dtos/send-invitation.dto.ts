import { ApiExtraModels } from '@nestjs/swagger';

@ApiExtraModels()
export class SendInvitationDto {
    email: string;
}

@ApiExtraModels()
export class BulkSendInvitationDto {
    invitations: SendInvitationDto[];
    ecosystemId: string;
}