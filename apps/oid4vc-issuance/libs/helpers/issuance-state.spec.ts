import { describeIssuanceState, withIssuanceStatus } from './issuance-state';

const now = new Date('2026-11-10T12:00:00.000Z');
const future = '2026-11-10T13:00:00.000Z';
const past = '2026-11-10T11:00:00.000Z';

describe('describeIssuanceState', () => {
  it('says an unopened or opened offer can still be redeemed', () => {
    expect(describeIssuanceState('OfferCreated', future, now)).toMatchObject({
      code: 'OfferCreated',
      canBeRedeemed: true,
      needsNewOffer: false
    });
    expect(describeIssuanceState('OfferUriRetrieved', future, now).canBeRedeemed).toBe(true);
  });

  it('says an offer past its expiry is expired, but only while it was still unused', () => {
    expect(describeIssuanceState('OfferCreated', past, now)).toMatchObject({
      label: 'Expired',
      canBeRedeemed: false,
      needsNewOffer: true
    });
    expect(describeIssuanceState('Completed', past, now).label).toBe('Credential sent to the wallet');
  });

  it('explains that an authorised wallet with no credential needs a new offer', () => {
    const status = describeIssuanceState('AccessTokenCreated', future, now);
    expect(status).toMatchObject({ canBeRedeemed: false, needsNewOffer: true });
    expect(status.description).toContain('create a new offer');
  });

  it('does not claim a completed session was accepted by the wallet', () => {
    const status = describeIssuanceState('Completed', future, now);
    expect(status.description).toContain('Whether the wallet accepted it is not reported back');
    expect(status.canBeRedeemed).toBe(false);
  });

  it('says a failed session needs a new offer', () => {
    expect(describeIssuanceState('Error', future, now)).toMatchObject({ label: 'Issuing failed', needsNewOffer: true });
  });

  it('passes an unknown state through', () => {
    expect(describeIssuanceState('SomethingNew', future, now)).toMatchObject({
      code: 'SomethingNew',
      label: 'SomethingNew',
      canBeRedeemed: false
    });
  });
});

describe('withIssuanceStatus', () => {
  it('adds a status to a session and to each session of a list', () => {
    const session = { id: 'a', state: 'Error', expiresAt: future };
    expect(withIssuanceStatus(session)).toMatchObject({ id: 'a', status: { label: 'Issuing failed' } });
    expect(withIssuanceStatus([session, { id: 'b', state: 'OfferCreated', expiresAt: future }])).toHaveLength(2);
    expect((withIssuanceStatus([session]) as { status: unknown }[])[0].status).toBeDefined();
  });

  it('leaves other shapes alone', () => {
    expect(withIssuanceStatus({ message: 'nothing' })).toEqual({ message: 'nothing' });
    expect(withIssuanceStatus(null)).toBeNull();
  });
});
