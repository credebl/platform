import { HttpException, HttpStatus } from '@nestjs/common';
import { ClientRegistrationService } from './client-registration.service';

describe('ClientRegistrationService.getRealmRoleByName', () => {
  const role = { id: 'realm-holder-id', name: 'holder' };

  function createService(httpGet: jest.Mock): {
    service: ClientRegistrationService;
    commonService: { httpGet: jest.Mock };
    keycloakUrlService: { GetRealmRoleURL: jest.Mock };
  } {
    const commonService = { httpGet };
    const keycloakUrlService = {
      GetRealmRoleURL: jest.fn().mockResolvedValue('https://kc/admin/realms/r/roles/holder')
    };
    const service = new ClientRegistrationService(commonService as never, keycloakUrlService as never);
    return { service, commonService, keycloakUrlService };
  }

  it('returns the role fetched by name', async () => {
    const { service, commonService, keycloakUrlService } = createService(jest.fn().mockResolvedValue(role));

    await expect(service.getRealmRoleByName('token', 'holder')).resolves.toEqual(role);

    expect(keycloakUrlService.GetRealmRoleURL).toHaveBeenCalledWith(process.env.KEYCLOAK_REALM, 'holder');
    expect(commonService.httpGet).toHaveBeenCalledWith('https://kc/admin/realms/r/roles/holder', {
      headers: { authorization: 'Bearer token' }
    });
  });

  it('returns null when Keycloak answers 404 for the role', async () => {
    const notFound = new HttpException({ statusCode: HttpStatus.NOT_FOUND }, HttpStatus.NOT_FOUND);
    const { service } = createService(jest.fn().mockRejectedValue(notFound));

    await expect(service.getRealmRoleByName('token', 'holder')).resolves.toBeNull();
  });

  it('rethrows errors other than 404', async () => {
    const unauthorized = new HttpException({ statusCode: HttpStatus.UNAUTHORIZED }, HttpStatus.UNAUTHORIZED);
    const { service } = createService(jest.fn().mockRejectedValue(unauthorized));

    await expect(service.getRealmRoleByName('token', 'holder')).rejects.toBe(unauthorized);
  });
});
