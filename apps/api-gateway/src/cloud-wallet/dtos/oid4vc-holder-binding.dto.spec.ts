import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { RequestCredentialDto } from './oid4vc-holder.dto';

describe('RequestCredentialDto binding validation (design spec 5.1 / 5.2)', () => {
  // Same pipe options as the api-gateway global pipe in main.ts
  const pipe = new ValidationPipe({
    whitelist: true,
    transform: true,
    validationError: { target: false, value: false }
  });

  const base = {
    credentialOfferUri: 'openid-credential-offer://?credential_offer=eyJ',
    credentialsToRequest: ['UniversityDegreeCredential']
  };

  async function transform(body: object): Promise<Record<string, unknown>> {
    const dto = await pipe.transform(body, { type: 'body', metatype: RequestCredentialDto });
    return JSON.parse(JSON.stringify(dto)) as Record<string, unknown>;
  }

  async function errorMessages(body: object): Promise<string[]> {
    try {
      await transform(body);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as { message: string[] };
      return response.message;
    }
    throw new Error('expected validation to fail');
  }

  it('keeps a new-key binding object unchanged through whitelist validation (P-FK-16)', async () => {
    const binding = { mode: 'new-key', didMethod: 'did:jwk', signatureAlgorithm: 'EdDSA' };
    const forwarded = await transform({ ...base, binding });

    expect(forwarded.binding).toEqual(binding);
    expect(forwarded.holderDidUrl).toBeUndefined();
  });

  it('keeps an existing-did binding object unchanged, including policy (P-ED-11)', async () => {
    const binding = {
      mode: 'existing-did',
      holderDidUrl: 'did:web:holder.example.com#key-1',
      policy: 'require'
    };
    const forwarded = await transform({ ...base, binding });

    expect(forwarded.binding).toEqual(binding);
    expect(forwarded.holderDidUrl).toBeUndefined();
  });

  it('accepts a flat holderDidUrl unchanged for backward compatibility (P-ED-01)', async () => {
    const forwarded = await transform({ ...base, holderDidUrl: 'did:key:z6Mk#key-1', bindingPolicy: 'prefer' });

    expect(forwarded.holderDidUrl).toBe('did:key:z6Mk#key-1');
    expect(forwarded.bindingPolicy).toBe('prefer');
  });

  it('accepts flat and nested forms when the DID agrees', async () => {
    const didUrl = 'did:jwk:eyJ#key-1';
    const forwarded = await transform({
      ...base,
      holderDidUrl: didUrl,
      binding: { mode: 'existing-did', holderDidUrl: didUrl, policy: 'prefer' }
    });

    expect(forwarded.holderDidUrl).toBe(didUrl);
    expect((forwarded.binding as { holderDidUrl: string }).holderDidUrl).toBe(didUrl);
  });

  it('rejects an unknown binding mode with INVALID_BINDING_MODE (N-V-01)', async () => {
    const messages = await errorMessages({ ...base, binding: { mode: 'bogus' } });
    expect(messages.some((message) => message.endsWith('INVALID_BINDING_MODE'))).toBe(true);
  });

  it('rejects existing-did without a DID with MISSING_HOLDER_DID_URL (N-V-02)', async () => {
    const messages = await errorMessages({ ...base, binding: { mode: 'existing-did' } });
    expect(messages).toContain('MISSING_HOLDER_DID_URL');
  });

  it('rejects conflicting flat and nested DIDs with CONFLICTING_HOLDER_DID_URL (N-V-03)', async () => {
    const messages = await errorMessages({
      ...base,
      holderDidUrl: 'did:key:z6Mk#one',
      binding: { mode: 'existing-did', holderDidUrl: 'did:key:z6Mk#two' }
    });
    expect(messages).toContain('CONFLICTING_HOLDER_DID_URL');
  });

  it('rejects new-key fields in existing-did mode (N-V-04, N-V-05)', async () => {
    const messages = await errorMessages({
      ...base,
      binding: {
        mode: 'existing-did',
        holderDidUrl: 'did:key:z6Mk#key-1',
        didMethod: 'did:key'
      }
    });
    expect(messages).toContain('INVALID_BINDING_OPTIONS');
  });

  it('rejects a DID in new-key mode (N-V-06)', async () => {
    const messages = await errorMessages({
      ...base,
      binding: { mode: 'new-key', holderDidUrl: 'did:key:z6Mk#key-1' }
    });
    expect(messages).toContain('CONFLICTING_HOLDER_DID_URL');
  });

  it('rejects a flat DID combined with nested new-key (N-V-06)', async () => {
    const messages = await errorMessages({
      ...base,
      holderDidUrl: 'did:key:z6Mk#key-1',
      binding: { mode: 'new-key' }
    });
    expect(messages).toContain('CONFLICTING_HOLDER_DID_URL');
  });

  it('strips unknown nested properties but preserves valid binding fields', async () => {
    const forwarded = await transform({
      ...base,
      binding: { mode: 'new-key', signatureAlgorithm: 'ES256', unexpected: 'drop-me' }
    });

    expect(forwarded.binding).toEqual({ mode: 'new-key', signatureAlgorithm: 'ES256' });
  });
});
