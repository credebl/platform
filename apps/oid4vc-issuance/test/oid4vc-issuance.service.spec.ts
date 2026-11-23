import { of } from 'rxjs';
import { SignerOption, credential_templates as CredentialTemplate } from '@prisma/client';
import { CredentialFormat } from '@credebl/enum/enum';
import { CreateOidcCredentialOffer } from '../interfaces/oid4vc-issuer-sessions.interfaces';
import { Oid4vcIssuanceService } from '../src/oid4vc-issuance.service';
import { CredentialOfferPayload, buildCredentialOfferPayload } from '../libs/helpers/credential-sessions.builder';

jest.mock('../libs/helpers/credential-sessions.builder', () => ({
  ...jest.requireActual('../libs/helpers/credential-sessions.builder'),
  buildCredentialOfferPayload: jest.fn()
}));

const buildOfferMock = buildCredentialOfferPayload as jest.MockedFunction<typeof buildCredentialOfferPayload>;

type ServiceConstructorParams = ConstructorParameters<typeof Oid4vcIssuanceService>;
type UserDetails = Parameters<Oid4vcIssuanceService['createOidcCredentialOffer']>[2];

const dto = {
  credentials: [{ templateId: 'tpl-1', payload: { name: 'Alice' } }],
  authorizationType: 'noAuth'
} as unknown as CreateOidcCredentialOffer;

const template = {
  id: 'tpl-1',
  canBeRevoked: true,
  format: CredentialFormat.SdJwtVc,
  signerOption: SignerOption.DID
} as unknown as CredentialTemplate;

const createProxy = (): { send: jest.Mock } => ({
  send: jest.fn().mockReturnValue(of({ issuanceSessionId: 'session-1' }))
});

type RepositoryMock = {
  getTemplateByIds: jest.Mock;
  getAgentEndPoint: jest.Mock;
  getOidcIssuerDetailsById: jest.Mock;
  getTemplateById: jest.Mock;
};

const createRepository = (): RepositoryMock => ({
  getTemplateByIds: jest.fn().mockResolvedValue([template]),
  getAgentEndPoint: jest.fn().mockResolvedValue({
    agentEndPoint: 'http://agent.example.com',
    orgDid: 'did:example:org'
  }),
  getOidcIssuerDetailsById: jest.fn().mockResolvedValue({
    publicIssuerId: 'issuer-1',
    authorizationServerUrl: 'https://auth.example.com'
  }),
  getTemplateById: jest.fn().mockResolvedValue(template)
});

type AllocatorMock = {
  allocate: jest.Mock;
  release: jest.Mock;
  saveCredentialAllocation: jest.Mock;
};

const createAllocator = (): AllocatorMock => ({
  allocate: jest.fn().mockResolvedValue({ listId: 'list-1', index: 7 }),
  release: jest.fn().mockResolvedValue(undefined),
  saveCredentialAllocation: jest.fn().mockResolvedValue(undefined)
});

const makeOffer = (isRevocable: boolean): CredentialOfferPayload =>
  ({
    isRevocable,
    credentials: [
      {
        credentialSupportedId: 'sdjwt',
        format: CredentialFormat.SdJwtVc,
        payload: {},
        isRevocable: true
      },
      {
        credentialSupportedId: 'ldp-vc',
        format: CredentialFormat.LdpVc,
        payload: {},
        isRevocable: false
      }
    ],
    preAuthorizedCodeFlowConfig: {}
  }) as unknown as CredentialOfferPayload;

describe('Oid4vcIssuanceService.createOidcCredentialOffer revocation allocation', () => {
  let proxy: ReturnType<typeof createProxy>;
  let allocator: ReturnType<typeof createAllocator>;
  let service: Oid4vcIssuanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STATUS_LIST_HOST = 'https://status-list.example.com';

    proxy = createProxy();
    const repository = createRepository();
    allocator = createAllocator();
    service = new Oid4vcIssuanceService(
      proxy as unknown as ServiceConstructorParams[0],
      repository as unknown as ServiceConstructorParams[1],
      allocator as unknown as ServiceConstructorParams[2]
    );
  });

  it('allocates only for credentials marked revocable', async () => {
    buildOfferMock.mockReturnValue(makeOffer(true));

    await service.createOidcCredentialOffer(dto, 'org-1', {} as UserDetails, 'issuer-1');

    expect(allocator.allocate).toHaveBeenCalledTimes(1);
    expect(allocator.allocate).toHaveBeenCalledWith('org-1', 'did:example:org');
    expect(allocator.saveCredentialAllocation).toHaveBeenCalledTimes(1);
    expect(allocator.saveCredentialAllocation).toHaveBeenCalledWith(
      'org-1',
      'session-1-7',
      'list-1',
      7,
      'session-1',
      'https://status-list.example.com/status-lists/list-1'
    );
  });

  it('does not allocate for a non-revocable offer', async () => {
    buildOfferMock.mockReturnValue(makeOffer(false));

    await service.createOidcCredentialOffer(dto, 'org-1', {} as UserDetails, 'issuer-1');

    expect(allocator.allocate).not.toHaveBeenCalled();
    expect(allocator.saveCredentialAllocation).not.toHaveBeenCalled();
  });

  it('releases allocated indices when persisting allocation fails', async () => {
    buildOfferMock.mockReturnValue(makeOffer(true));
    allocator.saveCredentialAllocation.mockRejectedValue(new Error('db down'));

    await expect(service.createOidcCredentialOffer(dto, 'org-1', {} as UserDetails, 'issuer-1')).rejects.toBeDefined();

    expect(allocator.release).toHaveBeenCalledWith('list-1', 7);
  });
});
