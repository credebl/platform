/* eslint-disable @typescript-eslint/no-explicit-any */
import { ForbiddenException } from '@nestjs/common';
import { OrgRoles } from 'libs/org-roles/enums';
import { OrgRolesGuard } from '../authz/guards/org-roles.guard';
import { ROLES_KEY } from '../authz/decorators/roles.decorator';
import { CloudWalletController } from './cloud-wallet.controller';

describe('CloudWalletController base wallet authorization', () => {
  it('marks base-wallet configuration as platform-admin-only', () => {
    expect(Reflect.getMetadata(ROLES_KEY, CloudWalletController.prototype.configureBaseWallet)).toEqual([OrgRoles.PLATFORM_ADMIN]);
  });

  function contextFor(user: object): any {
    return {
      getHandler: () => CloudWalletController.prototype.configureBaseWallet,
      getClass: () => CloudWalletController,
      switchToHttp: () => ({
        getRequest: () => ({ user, params: {}, query: {}, body: {} })
      })
    };
  }

  const reflector = {
    getAllAndOverride: jest.fn().mockReturnValue([OrgRoles.PLATFORM_ADMIN])
  };

  it('rejects a non-administrator from configuring the base wallet', async () => {
    const guard = new OrgRolesGuard(reflector as any);

    await expect(guard.canActivate(contextFor({ userOrgRoles: [] }))).resolves.toBe(false);
  });

  it('allows a platform administrator to configure the base wallet', async () => {
    const guard = new OrgRolesGuard(reflector as any);

    await expect(
      guard.canActivate(
        contextFor({
          userOrgRoles: [{ orgRole: { name: OrgRoles.PLATFORM_ADMIN } }]
        })
      )
    ).resolves.toBe(true);
  });

  it('rejects a holder even if the holder has no organization selected', async () => {
    const guard = new OrgRolesGuard(reflector as any);

    await expect(guard.canActivate(contextFor({ userRole: ['holder'], userOrgRoles: [] }))).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });
});
