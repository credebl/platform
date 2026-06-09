export * from './connection.interfaces';
export * from './connection-search.interface';
export * from './messaging.interfaces';
export { IReceiveInvitationResponse as IReceiveInvitationRes } from './connection.interfaces';

// api-gateway-specific connection shape (not in shared interfaces)
export class IConnectionInterface {
  tag: object;
  createdAt: string;
  updatedAt: string;
  connectionId: string;
  state: string;
  orgDid: string;
  theirLabel: string;
  autoAcceptConnection: boolean;
  outOfBandId: string;
  orgId: string;
}
