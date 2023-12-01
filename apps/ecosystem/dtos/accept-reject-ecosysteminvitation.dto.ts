import { Invitation } from '@credebl/enum/enum';

export class AcceptRejectEcosystemInvitationDto {
    orgId: string;
    invitationId: string;
    status: Invitation;
    orgName?: string;
    orgDid?: string;
    userId?: string;
}
