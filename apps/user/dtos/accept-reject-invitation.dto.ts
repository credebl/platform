import { Invitation } from '@credebl/enum/enum';

export class AcceptRejectInvitationDto {
    invitationId: number;
    orgId: number;
    status: Invitation;
}
