import { ResponseMessages } from '@credebl/common/response-messages';

import { evaluateDidDeletion } from './did-deletion';

const { error } = ResponseMessages.organisation;
const noUsage = { schemas: 0, statusLists: 0, holderNotifications: 0, invitations: 0 };
const unused = { isPrimaryDid: false, wasPrimary: false };

describe('evaluateDidDeletion', () => {
  it('allows deleting a DID that was never primary and is not used', () => {
    expect(evaluateDidDeletion(unused, noUsage)).toEqual({ allowed: true, reasons: [] });
  });

  it('rejects the primary DID', () => {
    expect(evaluateDidDeletion({ isPrimaryDid: true, wasPrimary: false }, noUsage)).toEqual({
      allowed: false,
      reasons: [error.didDeletePrimary]
    });
  });

  it('rejects a DID that has been primary', () => {
    expect(evaluateDidDeletion({ isPrimaryDid: false, wasPrimary: true }, noUsage)).toEqual({
      allowed: false,
      reasons: [error.didDeleteWasPrimary]
    });
  });

  it.each([
    ['schemas', error.didDeleteSchemas],
    ['statusLists', error.didDeleteStatusLists],
    ['holderNotifications', error.didDeleteHolderNotifications],
    ['invitations', error.didDeleteInvitations]
  ])('rejects a DID used by %s', (usageKey, reason) => {
    expect(evaluateDidDeletion(unused, { ...noUsage, [usageKey]: 2 })).toEqual({ allowed: false, reasons: [reason] });
  });

  it('lists every reason that applies', () => {
    const check = evaluateDidDeletion(
      { isPrimaryDid: true, wasPrimary: true },
      { schemas: 1, statusLists: 1, holderNotifications: 1, invitations: 1 }
    );

    expect(check.allowed).toBe(false);
    expect(check.reasons).toHaveLength(6);
  });
});
