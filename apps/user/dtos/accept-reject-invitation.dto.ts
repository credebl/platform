import { Invitation } from '@credebl/enum/enum';

export class AcceptRejectInvitationDto {
    invitationId: string;
    orgId: string;
    status: Invitation;
}
