export interface ConnectionNotificationPayload {
  id: number;
  createDateTime: string;
  createdBy: number;
  lastChangedDateTime: string;
  lastChangedBy: number;
  connectionId: string;
  state: string;
  orgDid: string;
  theirLabel: string;
  autoAcceptConnection: boolean;
  outOfBandId: string;
  orgId: number;
  threadId: string;
}

export interface UserRequest {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  clientId: null | string;
  clientSecret: null | string;
  supabaseUserId: string;
  userOrgRoles: [];
  exp: number;
  iat: number;
  sub: string;
  phone: string;
  app_metadata: {
    provider: string;
    providers: [];
  };
  user_metadata: Record<string, unknown>;
  aal: string;
  amr: [][]; 
  session_id: string;
}

