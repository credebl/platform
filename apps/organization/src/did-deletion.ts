import { ResponseMessages } from '@credebl/common/response-messages';

import { IDidDeletionCheck, IDidUsage } from '../interfaces/organization.interface';

interface IDidDeletionSubject {
  isPrimaryDid: boolean;
  wasPrimary: boolean;
}

/**
 * A DID may only be deleted when nothing can still depend on it: it is not the primary DID, it never was one
 * (existing rows count as having been primary) and no schema, status list, notification or invitation uses it.
 */
export function evaluateDidDeletion(subject: IDidDeletionSubject, usage: IDidUsage): IDidDeletionCheck {
  const { error } = ResponseMessages.organisation;
  const reasons: string[] = [];

  if (subject.isPrimaryDid) {
    reasons.push(error.didDeletePrimary);
  }
  if (subject.wasPrimary) {
    reasons.push(error.didDeleteWasPrimary);
  }
  if (0 < usage.schemas) {
    reasons.push(error.didDeleteSchemas);
  }
  if (0 < usage.statusLists) {
    reasons.push(error.didDeleteStatusLists);
  }
  if (0 < usage.holderNotifications) {
    reasons.push(error.didDeleteHolderNotifications);
  }
  if (0 < usage.invitations) {
    reasons.push(error.didDeleteInvitations);
  }

  return { allowed: 0 === reasons.length, reasons };
}
