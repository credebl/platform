import { Invitation } from '@credebl/enum/enum';

export class UpdateInvitationDto {
    invitationId: string;
    orgId: string;
    status: Invitation;
    userId: string;
    keycloakUserId: string;
    email: string;
}