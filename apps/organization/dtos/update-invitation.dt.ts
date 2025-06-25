import { Invitation } from '@credebl/common/enum/enum';

export class UpdateInvitationDto {
    invitationId: string;
    orgId: string;
    status: Invitation;
    userId: string;
    keycloakUserId: string;
    email: string;
}