import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Invitation, InviteType } from '@credebl/enum/enum';
import { EcosystemService } from './ecosystem.service';

describe('EcosystemService inviteMemberToEcosystem', () => {
  let service: EcosystemService;
  const mockPrisma = {
    platform_config: {
      findFirst: jest.fn()
    }
  };
  const mockOrganizationRepository = {
    getOrgProfile: jest.fn()
  };
  const mockEcosystemRepository = {
    getUserById: jest.fn(),
    getEcosystemInvitationsByEmail: jest.fn(),
    updateEcosystemInvitationStatusByEmail: jest.fn(),
    createEcosystemInvitation: jest.fn(),
    getEcosystemById: jest.fn()
  };
  const mockEmailService = {
    sendEmail: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EcosystemService(
      {} as never,
      {} as never,
      mockEcosystemRepository as never,
      mockPrisma as never,
      mockEmailService as never,
      mockOrganizationRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    mockPrisma.platform_config.findFirst.mockResolvedValue({ emailFrom: 'noreply@test.com' });
    mockOrganizationRepository.getOrgProfile.mockResolvedValue({ createdBy: 'user-creator-id' });
    mockEcosystemRepository.getUserById.mockResolvedValue({
      id: 'invited-user-id',
      email: 'member@org.com',
      firstName: 'Member',
      lastName: 'User'
    });
  });

  it.each([
    { status: Invitation.ACCEPTED, desc: 'an accepted' },
    { status: Invitation.PENDING, desc: 'a pending' }
  ])('throws 409 Conflict when re-inviting $desc ecosystem member', async ({ status }) => {
    mockEcosystemRepository.getEcosystemInvitationsByEmail.mockResolvedValue({
      id: 'invitation-id',
      ecosystemId: 'eco-1',
      invitedOrg: 'org-1',
      status,
      type: InviteType.MEMBER
    });

    try {
      await service.inviteMemberToEcosystem('org-1', 'req-user-id', 'eco-1');
      fail('Expected inviteMemberToEcosystem to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(RpcException);
      const rpcError = (error as RpcException).getError() as { statusCode?: number; status?: number; message?: string };
      expect(rpcError.statusCode ?? rpcError.status).toBe(HttpStatus.CONFLICT);
      expect(rpcError.message).toContain('member@org.com');
    }

    expect(mockEcosystemRepository.createEcosystemInvitation).not.toHaveBeenCalled();
  });

  it('does not double-wrap an RpcException thrown from createEcosystemInvitation', async () => {
    mockEcosystemRepository.getEcosystemInvitationsByEmail.mockResolvedValue(null);
    const originalRpcException = new RpcException({
      statusCode: HttpStatus.CONFLICT,
      message: 'Invitation already exists for this email in the ecosystem'
    });
    mockEcosystemRepository.createEcosystemInvitation.mockRejectedValue(originalRpcException);

    try {
      await service.inviteMemberToEcosystem('org-1', 'req-user-id', 'eco-1');
      fail('Expected inviteMemberToEcosystem to throw');
    } catch (error) {
      expect(error).toBe(originalRpcException);
      const rpcError = (error as RpcException).getError() as { statusCode?: number };
      expect(rpcError.statusCode).toBe(HttpStatus.CONFLICT);
    }
  });
});
