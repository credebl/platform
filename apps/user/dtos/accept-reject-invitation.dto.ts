import { Invitation } from '@credebl/common/enum/enum';

export class AcceptRejectInvitationDto {
    invitationId: string;
    orgId: string;
    status: Invitation;
}
