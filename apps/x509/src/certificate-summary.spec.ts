import { ConflictException, NotFoundException } from '@nestjs/common';
import { describeCertificate } from './certificate-summary';
import { X509CertificateService } from './x509.service';

// A throwaway certificate made for these tests (public certificate only), common name ibdic.in.
const LEAF = `-----BEGIN CERTIFICATE-----
MIIB1TCCAXygAwIBAgIJAJ26XMJqbrvmMAoGCCqGSM49BAMCMDsxCzAJBgNVBAYT
AklOMQ0wCwYDVQQKDARUZXN0MR0wGwYDVQQDDBRUZXN0IEludGVybWVkaWF0ZSBD
QTAeFw0yNjExMDkxOTM1MjhaFw0yNzExMDkxOTM1MjhaMC8xCzAJBgNVBAYTAklO
MQ0wCwYDVQQKDARUZXN0MREwDwYDVQQDDAhpYmRpYy5pbjBZMBMGByqGSM49AgEG
CCqGSM49AwEHA0IABF2SOmEKVhN2BG60E0TUfTAi7XV35VOsmSsx7hdJG+Qytzkz
UOx6c1m1A60Z+0BGBySoQWA1cJexVSNbPYyCuWejdTBzMAwGA1UdEwEB/wQCMAAw
DgYDVR0PAQH/BAQDAgeAMBMGA1UdEQQMMAqCCGliZGljLmluMB0GA1UdDgQWBBT5
0IhrfrSjQ2PJxSLqaLLcY0RHnzAfBgNVHSMEGDAWgBSdA1F44PJhX8dsrYJ5VEKU
8YpgfTAKBggqhkjOPQQDAgNHADBEAiBycobKJUAjNM+ffbGtIPHEl7ykUze+dRbe
LB+1+YOecgIgUx7+J5IHa6UvKp9QDNjF9qvjs0e1R/ReoFjt/vLTaP4=
-----END CERTIFICATE-----`;
const toBase64Der = (pem: string): string => pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');

describe('describeCertificate', () => {
  it('names a certificate by common name, expiry and short id', () => {
    expect(
      describeCertificate({
        id: 'a50877c5-ee28-4f30-98e3-52d14af2f378',
        certificateBase64: toBase64Der(LEAF),
        expiry: new Date('2027-11-10T01:44:00.000Z')
      })
    ).toBe('ibdic.in (expires 10 Nov 2027, id a50877c5)');
  });

  it('still names a certificate it cannot read', () => {
    expect(
      describeCertificate({
        id: '12345678-0000',
        certificateBase64: 'not a certificate',
        expiry: new Date('2027-01-02')
      })
    ).toBe('certificate (expires 2 Jan 2027, id 12345678)');
  });
});

describe('X509CertificateService.activateCertificate', () => {
  const pending = { id: 'p-1', validFrom: new Date('2026-11-01'), expiry: new Date('2027-11-01'), keyType: 'P-256' };
  const active = {
    id: 'a50877c5-ee28-4f30-98e3-52d14af2f378',
    certificateBase64: toBase64Der(LEAF),
    expiry: new Date('2027-11-10T01:44:00.000Z')
  };
  const repository = { findById: jest.fn(), hasDateCollision: jest.fn(), updateStatus: jest.fn() };
  const service = new X509CertificateService(repository as never, {} as never);
  const payload = { orgId: 'org', id: 'p-1', user: { id: 'u' } as never };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('names the active certificate that is in the way', async () => {
    repository.findById.mockResolvedValue(pending);
    repository.hasDateCollision.mockResolvedValue({ hasCollision: true, collisions: [active] });

    await expect(service.activateCertificate(payload)).rejects.toThrow(ConflictException);
    await expect(service.activateCertificate(payload)).rejects.toThrow(
      'Inactivate the previous one. Conflicting certificate: ibdic.in (expires 10 Nov 2027, id a50877c5)'
    );
    expect(repository.updateStatus).not.toHaveBeenCalled();
  });

  it('activates a certificate that nothing collides with, and reports an unknown one', async () => {
    repository.findById.mockResolvedValue(pending);
    repository.hasDateCollision.mockResolvedValue({ hasCollision: false, collisions: [] });
    repository.updateStatus.mockResolvedValue({ id: 'p-1', status: 'Active' });
    await expect(service.activateCertificate(payload)).resolves.toEqual({ id: 'p-1', status: 'Active' });

    repository.findById.mockResolvedValue(null);
    await expect(service.activateCertificate(payload)).rejects.toThrow(NotFoundException);
  });
});
