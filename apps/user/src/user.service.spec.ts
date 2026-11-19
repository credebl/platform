/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/explicit-function-return-type */
import { NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ResponseMessages } from '@credebl/common/response-messages';
import { OrgRoles } from 'libs/org-roles/enums';
import { UserService } from './user.service';

jest.mock('@credebl/user-activity', () => ({ UserActivityService: class {} }), { virtual: true });
jest.mock('@credebl/supabase', () => ({ SupabaseService: class {} }), { virtual: true });

describe('UserService.createUserForToken holder realm role', () => {
  const userInfo = {
    email: 'Holder@Example.test',
    password: 'encrypted-password',
    firstName: 'Holder',
    lastName: 'User',
    isPasskey: false
  } as any;
  const userDetails = { id: 'user-id', clientId: 'client-id', clientSecret: 'client-secret', isEmailVerified: true };

  function createService(realmRoles: { id: string; name: string }[]) {
    const clientRegistrationService = {
      getManagementToken: jest.fn().mockResolvedValue('management-token'),
      getAllRealmRoles: jest.fn().mockResolvedValue(realmRoles),
      createUser: jest.fn().mockResolvedValue({ keycloakUserId: 'keycloak-user-id' }),
      createUserHolderRole: jest.fn().mockResolvedValue(undefined)
    };
    const userRepository = {
      getUserDetails: jest.fn().mockResolvedValue(userDetails),
      updateUserInfo: jest.fn().mockResolvedValue(userDetails),
      updateUserDetails: jest.fn().mockResolvedValue(undefined),
      addAccountDetails: jest.fn().mockResolvedValue(undefined)
    };
    const commonService = { decryptPassword: jest.fn().mockResolvedValue('password') };
    const orgRoleService = { getRole: jest.fn().mockResolvedValue({ id: 'org-holder-role-id' }) };
    const userOrgRoleService = { createUserOrgRole: jest.fn().mockResolvedValue(undefined) };
    const logger = { error: jest.fn() };

    const service = new UserService(
      {} as any,
      clientRegistrationService as any,
      {} as any,
      commonService as any,
      orgRoleService as any,
      userOrgRoleService as any,
      {} as any,
      userRepository as any,
      {} as any,
      {} as any,
      logger as any,
      {} as any,
      {} as any,
      {} as any
    );

    return { clientRegistrationService, userOrgRoleService, service };
  }

  it('assigns the holder realm role when the realm defines it', async () => {
    const holderRole = { id: 'realm-holder-id', name: OrgRoles.HOLDER };
    const { clientRegistrationService, userOrgRoleService, service } = createService([
      { id: 'other-id', name: 'other' },
      holderRole
    ]);

    await expect(service.createUserForToken({ ...userInfo })).resolves.toEqual({ userId: 'user-id' });

    expect(clientRegistrationService.createUserHolderRole).toHaveBeenCalledWith(
      'management-token',
      'keycloak-user-id',
      [holderRole]
    );
    expect(userOrgRoleService.createUserOrgRole).toHaveBeenCalledWith(
      'user-id',
      'org-holder-role-id',
      null,
      'realm-holder-id'
    );
  });

  it('fails with an actionable error, before creating the Keycloak user, when the realm lacks the holder role', async () => {
    const { clientRegistrationService, service } = createService([{ id: 'other-id', name: 'other' }]);

    const error = await service.createUserForToken({ ...userInfo }).catch((e) => e);

    expect(error).toBeInstanceOf(RpcException);
    const response = error.getError();
    expect(response).toEqual(new NotFoundException(ResponseMessages.user.error.holderRealmRoleNotFound).getResponse());
    expect(clientRegistrationService.createUser).not.toHaveBeenCalled();
    expect(clientRegistrationService.createUserHolderRole).not.toHaveBeenCalled();
  });
});
